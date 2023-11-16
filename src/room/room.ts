// path-to-room.ts
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config'; 

interface Player {
  uid: string;
  displayName: string;
  photoUrl: string;
  lastTyped: string;
  Wpm: number;
}

export interface Room {
  creator: Player;
  paragraph: string;
  timeInSeconds: number;
  gameStarted: boolean;
  players: Player[];
}

export const createRoom = async (creator: Player, paragraph: string, timeInSeconds: number): Promise<string> => {
  try {
    const roomData: Room = {
      creator,
      paragraph: paragraph,
      timeInSeconds: timeInSeconds,
      gameStarted: false,
      players: [creator], 
      
    };

   
    const roomRef = await addDoc(collection(db, 'rooms'), {
      ...roomData,
    });

    console.log(roomData)
    
    // Set the creator's UID as the document ID for easier reference
    // await setDoc(doc(db, 'rooms', creator.uid), { roomId: roomRef.id });

    return roomRef.id;
  } catch (error: any) {
    console.log(error.message)
    throw new Error(`Error creating room: ${error.message}`);
  }
};

export const joinRoom = async (roomId: string, player: Player): Promise<Room | null> => {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnapshot = await getDoc(roomRef);
  
      if (roomSnapshot.exists()) {
        const roomData = roomSnapshot.data() as Room;
  
        const existingPlayer = roomData.players.find((p) => p.uid === player.uid);
        if (!existingPlayer) {
          roomData.players.push(player);
          await updateDoc(roomRef, { players: roomData.players });
        }
  
        console.log(`Player ${player.displayName} joined room with ID: ${roomId}`);
        return roomData;
      } else {
        console.log(`Room with ID ${roomId} does not exist.`);
        return null;
      }
    } catch (error: any) {
      console.error('Error joining room:', error.message);
      return null;
    }
  };
