
import React, { FC, useState } from 'react';
import { createRoom } from '../room/room';
import { User } from '@firebase/auth';
import { Link } from 'react-router-dom';
import { Button } from 'flowbite-react';
import { useNavigate } from 'react-router-dom';

interface RoomCreationProps {
    user: User
}

const RoomCreation: FC<RoomCreationProps> = ({user}) => {

  const navigate=useNavigate()

    const player= {
        uid: user.uid,
        displayName: user.displayName || '',
        photoUrl: user?.photoURL || '',
        lastTyped: '',
        Wpm: 0  
    }

    const paragraph="this is a paragraph"
    const timeInSeconds = 30


  const handleCreateRoom = async () => {
    try {
      const roomId = await createRoom(player,paragraph,timeInSeconds);
      console.log('Created room with ID:', roomId);
      navigate(`/waiting/${roomId}`);
    } catch (error: any) {
      console.error('Error creating room:', error.message);
    }
  };

  return (
    <div className="pt-20 flex flex-col justify-center items-center gap-8 sm:gap-9">
      <h1 className="font-bold text-2xl sm:text-3xl">Compute With Your Friends</h1>
      <p className="px-10 text-center  text-xl  colour font-nunito leading-6  ">
        Game rules Lorem ipsum, dolor sit amet consectetur adipisicing elit.
        Culpa et asperiores aspernatur aliquam optio magni totam nostrum, ut
        nemo doloribus possimus placeat fugit, impedit, maxime atque at illo
        enim. Dolores provident, modi, sit commodi nemo saepe fuga, soluta eius
        dolorum numquam ex fugiat maxime in vero. Id mollitia cupiditate
        perferendis.
      </p>
      <div className="flex flex-col items-center sm:flex-row gap-6 sm:gap-14">
        <button
          onClick={handleCreateRoom}
          className="relative px-8 py-3 sm:px-9 sm:py-3 text-sm sm:text-base rounded-md text-skin-muted-button bg-skin-button-base transition-all duration-300 ease-in-out
                    hover:bg-transparent hover:bg-gradient-to-r hover:from-hue-base hover:via-hue-base hover:to-hue-base bg-[length:0%_4px] hover:bg-[length:100%_4px] hover:bg-no-repeat bg-bottom
                    before:w-0 before:bg-skin-button-muted/50 before:content-[''] before:absolute before:h-full before:top-0 before:left-0 hover:before:w-full before:transition-all before:duration-300 before:ease-in-out before:rounded-md"
        >
          Create Room
        </button>
        <Link
          to="/join"
          className="relative px-6 py-3 sm:px-9 sm:py-3 text-sm sm:text-base rounded-md text-skin-inverted bg-skin-button-muted transition-all duration-300 ease-in-out
          hover:text-skin-muted-button hover:bg-transparent hover:bg-gradient-to-r hover:from-hue-inverted hover:via-hue-inverted hover:to-hue-inverted bg-[length:0%_4px] hover:bg-[length:100%_4px] hover:bg-no-repeat bg-bottom
          before:w-0 before:bg-skin-button-base/50 before:content-[''] before:absolute before:h-full before:top-0 before:left-0 hover:before:w-full before:transition-all before:duration-300 before:ease-in-out before:rounded-md"
        >
          Join Room
        </Link>
      </div>
    </div>
  );
};

export default RoomCreation;
