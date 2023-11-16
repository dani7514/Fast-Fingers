import React, { useEffect, useState } from 'react';
import { signInWithGoogle, signOut, onAuthStateChange } from '../config/firebase.config';
import { User } from '@firebase/auth';
import RoomCreation from './createRoom';
import JoinRoom from './joinRoom';
import Header from './header';
import Paragraph from './paragraph';

const Login = () => {
  const [user, setUser] = useState<User | null>();
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      if (isMounted) {
        setUser(authUser); 
      }
    });

    return () => {
      setIsMounted(false);
    };
  }, [isMounted]);

  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.displayName}!</p>
         
        </div>
      ) : (
        <div>
          <p>Please sign in with Google to continue.</p>
          <button onClick={signInWithGoogle}>Sign In with Google</button>
        </div>
      )}
    </div>
  );
};

export default Login;