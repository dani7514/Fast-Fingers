
import { User } from '@firebase/auth'
import typingLogo from '../assets/typing.png'
import { FC, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { signInWithGoogle, signOut, onAuthStateChange } from '../config/firebase.config';

const Header = () => {
  const [user, setUser] = useState<User | null | undefined >();
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      if (isMounted) {
        setUser(authUser!); 
      }
    });

    return () => {
      setIsMounted(false);
    };
  }, [isMounted]);
  return (
    <div className='px-11 flex items-center justify-between '>
        <div className='flex items-center justify-center pl-5'>
            <img src={typingLogo}  className='w-20 h-20 pl-5'/>
            <Link 
            to={'/'}
            className='px-5 text-2xl colour font-nunito'>
                FastFinger
            </Link>
        </div>
        <div className='px-11 flex items-center justify-center '>
          {user ? 
          (
            <>
            <Link
            to={'/create'}
            className=" px-5 text-xl colour font-nunito relative  py-3 sm:px-9 sm:py-3   transition-all duration-300 ease-in-out
                      hover:bg-transparent hover:bg-gradient-to-r hover:from-hue-base hover:via-hue-base hover:to-hue-base bg-[length:0%_4px] hover:bg-[length:100%_4px] hover:bg-no-repeat bg-bottom
                      before:w-0 before:bg-skin-button-muted/50 before:content-[''] before:absolute before:h-full before:top-0 before:left-0 hover:before:w-full before:transition-all before:duration-300 before:ease-in-out before:rounded-md"
          >
            Compute With Your Friends
          </Link>
          <button
            onClick={signOut} 
            className="relative px-5 text-xl colour font-nunito  py-3 sm:px-9 sm:py-3  transition-all duration-300 ease-in-out
            hover:bg-transparent hover:bg-gradient-to-r hover:from-hue-base hover:via-hue-base hover:to-hue-base bg-[length:0%_4px] hover:bg-[length:100%_4px] hover:bg-no-repeat bg-bottom
            before:w-0 before:bg-skin-button-muted/50 before:content-[''] before:absolute before:h-full before:top-0 before:left-0 hover:before:w-full before:transition-all before:duration-300 before:ease-in-out before:rounded-md" 
          >Sign Out</button>
          {user?.photoURL&& user?.displayName&&<img className='rounded-full w-9 h-9' src={user.photoURL} alt={user.displayName} />}
            </>
          
          )
          : <button
            onClick={signInWithGoogle}
            className="relative px-5 text-xl colour font-nunito py-3 sm:px-9 sm:py-3   rounded-md  transition-all duration-300 ease-in-out
                      hover:bg-transparent hover:bg-gradient-to-r hover:from-hue-base hover:via-hue-base hover:to-hue-base bg-[length:0%_4px] hover:bg-[length:100%_4px] hover:bg-no-repeat bg-bottom
                      before:w-0 before:bg-skin-button-muted/50 before:content-[''] before:absolute before:h-full before:top-0 before:left-0 hover:before:w-full before:transition-all before:duration-300 before:ease-in-out before:rounded-md"
          >
            Login With Google
          </button>}
          
        </div>
       
    </div>
  )
}

export default Header