
// import './App.css';
import { useEffect, useState } from 'react';
import RoomCreation from './components/createRoom';
import Header from './components/header';
import Login from './components/login';
import Paragraph from './components/paragraph';
import { BrowserRouter as Router, Route,  Link, Routes } from 'react-router-dom';
import { onAuthStateChange } from './config/firebase.config';
import { User } from '@firebase/auth';
import JoinRoom from './components/joinRoom';
import WaitingRoom from './components/waiting';
import { faker } from '@faker-js/faker';
import MultiplayerParagraph from './components/multiplyPlayer';


function App() {
  const [user, setUser] = useState<User | null | undefined >();
  const [isMounted, setIsMounted] = useState(true);
  const [paragraph, setParagraph] = useState('');
  const numberOfWord = 50;

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
  
  useEffect(() => {
    setParagraph(generateWords(numberOfWord));
  }, []);

  const generateWords = (numberOfWord: number) => {
    return faker.word.words(numberOfWord);
  };

  return (
    <div className= "w-full overflow-auto p-11 font-nunito ">
      <Router>
        <Header  />
        <Routes>
          <Route path="/" element={<Paragraph  />} />
          {user && <Route path="/create" element={<RoomCreation user={user} />} />}
          {user && <Route path="/join" element={<JoinRoom user={user} />} />}
          {user && <Route path="/waiting/:roomId" element={<WaitingRoom user={user} />} />}
          <Route path="/multiplayer/:roomId" element={<MultiplayerParagraph />} />
        </Routes>
        
        {/* <Route path="/contact" component={Contact} />
        <Route path="/" component={Home} /> */}
      </Router>
      
    </div>
  );
}

export default App;
