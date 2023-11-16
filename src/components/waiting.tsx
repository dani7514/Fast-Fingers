import React, { FC, useEffect, useState } from 'react';
import { User } from '@firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../config/firebase.config';
import { Room } from '../room/room';
import { faker } from '@faker-js/faker';
import MultiplayerParagraph from './multiplyPlayer';

interface WaitingRoomProps {
  user: User;
}

const WaitingRoom: FC<WaitingRoomProps> = ({ user }) => {
    const [paragraph, setParagraph] = useState('');
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [players, setPlayers] = useState<string[]>([]);
  const [isCreator, setIsCreator] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [selectedSecond,setselectedSecond]=useState(15);
  const [isStarted, setIsStarted] = useState<boolean>(false);

  const numberOfWord = 50;

  useEffect(() => {
    if (!roomId) {
      console.log("Room ID is undefined");
      return;
    }

    const roomRef = doc(db, 'rooms', roomId);

    const unsubscribe = onSnapshot(roomRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const roomData = docSnapshot.data() as Room;
        const playerNames = roomData.players.map((player) => player.displayName);
        setPlayers(playerNames);
        setIsCreator(roomData.creator.uid === user.uid);
        setGameStarted(roomData.gameStarted);

        // Check if the gameStarted field is true and perform actions accordingly
        if (roomData.gameStarted) {
            navigate(`/multiplayer/${roomId}`)
        }
      } else {
        console.log(`Room with ID ${roomId} does not exist.`);
      }
    });

    return () => unsubscribe();
  }, [roomId, user, navigate]);

  useEffect(() => {
    setParagraph(generateWords(numberOfWord));
  }, []);

  const generateWords = (numberOfWord: number) => {
    return faker.word.words(numberOfWord);
  };

  const changeTime = (time: number) =>{
    setselectedSecond(time);
  }

  const handleStartGame = async (roomId: string) => {
    try {
      
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, { gameStarted: true , paragraph: generateWords(numberOfWord), timeInSeconds: selectedSecond });
      
    } catch (error: any) {
      console.error('Error starting the game:', error.message);
    }
  };

  return (
    <div className="pt-20 flex flex-col gap-2 items-center">
        
        <div className='flex items-center justify-center gap-3 rounded-lg '> 
            <button style={
                {
                    color: selectedSecond === 15 ? '#FFCEFB ': '',
                }
            } className='cursor-pointer rounded-md p-2 font-mono text-xl back' type="button" onClick={() =>{
                changeTime(15)
                // refresh(numberOfWord)
                }}>15s</button>
            <button style={
                {
                    color: selectedSecond === 30 ? '#FFCEFB ': '',
                }
            } className='cursor-pointer rounded-md p-2 font-mono text-xl back' type="button" onClick={() =>{
                changeTime(30)
                // refresh(numberOfWord)
                }}>30s</button>
            <button style={
                {
                    color: selectedSecond === 60 ? '#FFCEFB ': '',
                }
            } className='cursor-pointer rounded-md p-2 font-mono text-xl back ' type="button" onClick={() =>{
                changeTime(60)
                // refresh(numberOfWord)
                }}>60s</button>
        </div>
    <h1>Waiting Room - Room ID: {roomId}</h1>
    <h2>Players in the Room:</h2>
    <ul>
        {players.map((player, index) => (
        <li key={index}>{player}</li>
        ))}
    </ul>
    {isCreator && players.length >= 2 && !gameStarted && (
        <button onClick={()=>handleStartGame(roomId!)}>Start Game</button>
    )}
    
    
        
    </div>
  );
};

export default WaitingRoom;
