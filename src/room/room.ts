import { faker } from '@faker-js/faker';
import { User } from 'firebase/auth';
import { addDoc, collection, doc, onSnapshot, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase.config';

const countdownSeconds = 3;
export const roundDurations = [15, 30, 60];

interface Progress {
  lastTyped: string;
  Wpm: number;
}

interface Player extends Progress {
  uid: string;
  displayName: string;
  photoUrl: string;
}

export interface Room {
  creator: Player;
  paragraph: string;
  timeInSeconds: number;
  gameStarted: boolean;
  startedAt?: Timestamp | null;
  players: Player[];
  nextRoomId?: string;
  progress?: Record<string, Progress & { playerIndex: number }>;
}

function roomRef(roomId: string) {
  return doc(db, 'rooms', roomId);
}

function makePlayer(user: User): Player {
  return {
    uid: user.uid,
    displayName: user.displayName || 'Player',
    photoUrl: user.photoURL || '',
    lastTyped: '',
    Wpm: 0,
  };
}

export function getRoundStart(room: Room) {
  return room.startedAt ? room.startedAt.toMillis() + countdownSeconds * 1000 : null;
}

export function racePassage(duration: number) {
  return faker.word.words(Math.max(50, duration * 3));
}

export function typedInRoom(room: Room, player: Player) {
  return room.progress ? room.progress[player.uid]?.lastTyped ?? '' : player.lastTyped;
}

function makeRoom(user: User): Room {
  const creator = makePlayer(user);
  return {
    creator,
    paragraph: '',
    timeInSeconds: roundDurations[0],
    gameStarted: false,
    players: [creator],
  };
}

export async function createRoom(user: User) {
  const reference = await addDoc(collection(db, 'rooms'), makeRoom(user));
  return reference.id;
}

export async function joinRoom(roomId: string, user: User) {
  if (!roomId || roomId.includes('/')) {
    throw new Error('Enter a valid room ID.');
  }

  const reference = roomRef(roomId);
  await runTransaction(db, async (transaction) => {
    const room = (await transaction.get(reference)).data() as Room | undefined;
    if (!room) throw new Error('Room not found. Check the room ID.');
    if (room.players.some((player) => player.uid === user.uid)) return;
    if (getRoundStart(room) !== null) throw new Error('This race has already started.');

    transaction.update(reference, { players: [...room.players, makePlayer(user)] });
  });
}

export async function startRematch(roomId: string, uid: string) {
  const reference = roomRef(roomId);
  const next = doc(collection(db, 'rooms'));
  await runTransaction(db, async (transaction) => {
    const room = (await transaction.get(reference)).data() as Room | undefined;
    if (!room) throw new Error('This race is unavailable.');
    const playerIndex = room.players.findIndex((player) => player.uid === uid);
    if (playerIndex < 0) throw new Error('You are not in this room.');
    if (room.nextRoomId) return;

    const startsAt = getRoundStart(room);
    if (startsAt === null || Date.now() < startsAt + room.timeInSeconds * 1000) {
      throw new Error('The race is still in progress.');
    }

    transaction.set(next, {
      creator: room.creator,
      players: room.players,
      paragraph: racePassage(room.timeInSeconds),
      timeInSeconds: room.timeInSeconds,
      gameStarted: true,
      startedAt: serverTimestamp(),
      progress: {},
      previousRoomId: roomId,
      rematchPlayerIndex: playerIndex,
    });
    transaction.update(reference, { nextRoomId: next.id });
  });
}

export function subscribeToRoom(
  roomId: string,
  onRoom: (room: Room | null) => void,
  onError: () => void,
) {
  return onSnapshot(roomRef(roomId), (snapshot) => {
    onRoom(snapshot.exists() ? snapshot.data() as Room : null);
  }, onError);
}

export async function startRoom(roomId: string, uid: string, paragraph: string, timeInSeconds: number) {
  const reference = roomRef(roomId);
  await runTransaction(db, async (transaction) => {
    const room = (await transaction.get(reference)).data() as Room | undefined;
    if (!room) throw new Error('This room no longer exists.');
    if (room.creator.uid !== uid) throw new Error('Only the host can start the race.');
    if (getRoundStart(room) !== null) return;
    if (room.players.length < 2) throw new Error('At least two players are needed to start.');

    transaction.update(reference, {
      paragraph,
      timeInSeconds,
      gameStarted: true,
      startedAt: serverTimestamp(),
      players: room.players.map((player) => ({ ...player, lastTyped: '', Wpm: 0 })),
    });
  });
}

export function scoreTyping(paragraph: string, input: string, timeInSeconds: number) {
  const correct = input.split('').filter((character, index) => character === paragraph[index]).length;
  const accuracy = input.length ? Math.round(100 * correct / input.length) : 0;
  return { correct, accuracy, wpm: Math.round(correct * 60 / (5 * timeInSeconds)) };
}

export async function saveProgress(roomId: string, uid: string, input: string) {
  const reference = roomRef(roomId);
  await runTransaction(db, async (transaction) => {
    const room = (await transaction.get(reference)).data() as Room | undefined;
    if (!room || getRoundStart(room) === null) throw new Error('This race is unavailable.');
    const player = room.players.find((entry) => entry.uid === uid);
    if (!player) throw new Error('You are not in this room.');
    if (typedInRoom(room, player) === input) return;

    const { wpm } = scoreTyping(room.paragraph, input, room.timeInSeconds);
    if (room.progress) {
      transaction.update(reference, {
        progress: { ...room.progress, [uid]: { lastTyped: input, Wpm: wpm, playerIndex: room.players.indexOf(player) } },
      });
      return;
    }
    transaction.update(reference, {
      players: room.players.map((entry) => entry.uid === uid
        ? { ...entry, lastTyped: input, Wpm: wpm }
        : entry),
    });
  });
}
