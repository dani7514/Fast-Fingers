import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import RoomCreation from './components/createRoom';
import Header from './components/header';
import Paragraph from './components/paragraph';
import JoinRoom from './components/joinRoom';
import RoomPage from './components/waiting';
import { onAuthStateChange, signInWithGoogle } from './config/firebase.config';

function App() {
  const [user, setUser] = useState<User | null>();

  useEffect(() => onAuthStateChange(setUser), []);

  const accountPrompt = user === undefined
    ? <p role="status" className="muted">Checking sign-in…</p>
    : <section className="narrow-page">
      <div className="page-heading"><h1>Race your friends</h1><p>Sign in with Google to create or join a race.</p></div>
      <button className="button button-primary" onClick={signInWithGoogle}>Sign in with Google</button>
    </section>;

  return (
    <BrowserRouter>
      <Header user={user} />
      <main className="site-main">
        <Routes>
          <Route path="/" element={<Paragraph />} />
          <Route path="/create" element={user ? <RoomCreation user={user} /> : accountPrompt} />
          <Route path="/join" element={user ? <JoinRoom user={user} /> : accountPrompt} />
          <Route path="/waiting/:roomId" element={user ? <RoomPage key={user.uid} user={user} /> : accountPrompt} />
          <Route path="/multiplayer/:roomId" element={user ? <RoomPage key={user.uid} user={user} /> : accountPrompt} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
