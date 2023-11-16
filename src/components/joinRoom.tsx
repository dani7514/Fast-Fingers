
import React, { FC, useState } from 'react';
import { joinRoom } from '../room/room';
import { User } from '@firebase/auth';
import { useNavigate } from 'react-router-dom';

interface RoomJoinProps {
    user: User
}

const JoinRoom: FC<RoomJoinProps> = ({user}) => {
  const [roomIdInput, setRoomIdInput] = useState('');
  const navigate=useNavigate()

  const handleJoinRoom = async () => {
    try {
        const player= {
            uid: user.uid,
            displayName: user.displayName || '',
            photoUrl: user?.photoURL || '',
            lastTyped: '',
            Wpm: 0  
        }

      const roomData = await joinRoom(roomIdInput, player);

      if (roomData) {
        console.log('Joined room:', roomData);
        navigate(`/waiting/${roomIdInput}`)
      } else {
        console.log('Room does not exist.');
      }
    } catch (error: any) {
      console.error('Error joining room:', error.message);
    }
  };

  return (
    <div className=" pt-20 flex flex-col gap-2 items-center">
      <input
        type="text"
        placeholder="Enter Room ID"
        value={roomIdInput}
        onChange={(e) => setRoomIdInput(e.target.value)}
      />
      {/* <br />
      <input
        type="text"
        placeholder="Enter Your Name"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
      /> */}
      <br />
      <button onClick={handleJoinRoom}>Join Room</button>
    </div>
  );
};

export default JoinRoom;
