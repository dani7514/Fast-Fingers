import { faker } from '@faker-js/faker';
import { FirebaseError } from 'firebase/app';
import { User } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, FieldPath, getDocFromServer, getDocsFromServer, onSnapshot, runTransaction, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase.config';

const countdownSeconds = 3;
const presenceIntervalMs = 5000;
const presenceExpiryMs = 20000;
export const resultSyncMs = 5000;
export const roundDurations = [15, 30, 60, 120];

interface Progress {
  lastTyped: string;
  Wpm: number;
  cursor?: number;
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
  nextPlayerUids?: string[];
  activePlayerUids?: string[];
  previousRoomId?: string;
  resultsFinalizedAt?: Timestamp;
  progress?: Record<string, Progress & { playerIndex: number }>;
}

function roomRef(roomId: string) {
  return doc(db, 'rooms', roomId);
}

function presenceCollection(roomId: string) {
  return collection(db, 'rooms', roomId, 'presence');
}

export function racePlayers(room: Room) {
  return room.players.filter((player) => !room.activePlayerUids || room.activePlayerUids.includes(player.uid));
}

export function trackRacePresence(roomId: string, uid: string, playerIndex: number) {
  const session = doc(presenceCollection(roomId));
  let pending = false;
  let closed = false;

  async function heartbeat() {
    if (pending || closed) return;
    pending = true;
    try {
      await setDoc(session, { uid, playerIndex, lastSeenAt: serverTimestamp() });
    } catch {
      // The next heartbeat retries after a temporary failure.
    } finally {
      pending = false;
    }
  }

  void heartbeat();
  const interval = window.setInterval(heartbeat, presenceIntervalMs);
  window.addEventListener('online', heartbeat);
  document.addEventListener('visibilitychange', heartbeat);
  window.addEventListener('pagehide', leavePage);

  function leavePage(event: PageTransitionEvent) {
    if (!event.persisted) stop();
  }

  function stop() {
    if (closed) return;
    closed = true;
    window.clearInterval(interval);
    window.removeEventListener('online', heartbeat);
    document.removeEventListener('visibilitychange', heartbeat);
    window.removeEventListener('pagehide', leavePage);
    // A closed browser may not send this write. Old heartbeats expire on their own.
    void deleteDoc(session).catch(() => undefined);
  }

  return stop;
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
  return progressInRoom(room, player)?.lastTyped ?? '';
}

export function cursorInRoom(room: Room, player: Player) {
  const progress = progressInRoom(room, player);
  return Math.min(room.paragraph.length, Math.max(0, progress?.cursor ?? progress?.lastTyped.length ?? 0));
}

function progressInRoom(room: Room, player: Player) {
  return room.progress?.[player.uid] ?? (room.previousRoomId ? undefined : player);
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
  const presence = await getDocsFromServer(presenceCollection(roomId));
  const cutoff = Date.now() - presenceExpiryMs;
  const connected = new Set(presence.docs.flatMap((session) => {
    const { uid, lastSeenAt } = session.data() as { uid: string; lastSeenAt: Timestamp | null };
    return lastSeenAt && lastSeenAt.toMillis() >= cutoff ? [uid] : [];
  }));

  return runTransaction(db, async (transaction) => {
    const room = (await transaction.get(reference)).data() as Room | undefined;
    if (!room) throw new Error('This race is unavailable.');
    const playerIndex = room.players.findIndex((player) => player.uid === uid);
    const players = racePlayers(room);
    if (!players.some((player) => player.uid === uid)) throw new Error('You are not in this room.');
    if (room.nextRoomId) return 'started';

    const startsAt = getRoundStart(room);
    if (startsAt === null || Date.now() < startsAt + room.timeInSeconds * 1000) {
      throw new Error('The race is still in progress.');
    }

    const activePlayerUids = Array.from(new Set(players
      .filter((player) => player.uid === uid || connected.has(player.uid))
      .map((player) => player.uid)));
    if (activePlayerUids.length < 2) return 'alone';

    transaction.set(next, {
      creator: room.creator,
      players: room.players,
      paragraph: racePassage(room.timeInSeconds),
      timeInSeconds: room.timeInSeconds,
      gameStarted: true,
      startedAt: serverTimestamp(),
      progress: {},
      activePlayerUids,
      previousRoomId: roomId,
      rematchPlayerIndex: playerIndex,
    });
    transaction.update(reference, { nextRoomId: next.id, nextPlayerUids: activePlayerUids });
    return 'started';
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

export async function finalizeResults(roomId: string, playerIndex: number) {
  const reference = roomRef(roomId);
  try {
    await runTransaction(db, async (transaction) => {
      const room = (await transaction.get(reference)).data() as Room | undefined;
      if (!room) throw new Error('This race is unavailable.');
      if (room.resultsFinalizedAt) return;

      transaction.update(reference, {
        resultsFinalizedAt: serverTimestamp(),
        resultsFinalizedByIndex: playerIndex,
      });
    });
  } catch (error) {
    // A simultaneous client may have locked the results before this write reached the rules.
    if (error instanceof FirebaseError && error.code === 'permission-denied') {
      const room = (await getDocFromServer(reference)).data() as Room | undefined;
      if (room?.resultsFinalizedAt) return;
    }
    throw error;
  }
}

export async function saveProgress(roomId: string, room: Room, uid: string, input: string, cursor: number) {
  if (room.resultsFinalizedAt) return;
  const playerIndex = room.players.findIndex((player) => player.uid === uid);
  const { wpm } = scoreTyping(room.paragraph, input, room.timeInSeconds);

  // Commit only this player's field. A read followed by a whole-room update can
  // be rejected by the rules if another player's update commits in between.
  await runTransaction(db, async (transaction) => {
    transaction.update(roomRef(roomId), new FieldPath('progress', uid), {
      lastTyped: input, Wpm: wpm, cursor, playerIndex,
    });
  });
}
