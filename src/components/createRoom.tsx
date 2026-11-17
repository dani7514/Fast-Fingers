import { useState } from 'react';
import { FirebaseError } from 'firebase/app';
import { User } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { createRoom } from '../room/room';

export default function RoomCreation({ user }: { user: User }) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function handleCreateRoom() {
    setCreating(true);
    setError('');
    try {
      const roomId = await createRoom(user);
      navigate('/waiting/' + roomId);
    } catch (error) {
      if (error instanceof FirebaseError) {
        setError(error.code === 'permission-denied'
          ? 'Firestore denied room creation (permission-denied). Check the rules for /rooms in Firebase.'
          : `Unable to create a room (${error.code}). ${error.message}`);
      } else {
        setError(error instanceof Error ? error.message : 'Unable to create a room. Try again.');
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="narrow-page">
      <div className="page-heading">
        <h1>Race your friends</h1>
        <p>Share an invite and see who can type the same passage fastest.</p>
      </div>
      <div className="panel">
        <div className="panel-content stack">
          <h2 className="section-heading">Start or join a race</h2>
          <div className="actions">
            <button type="button" className="button button-primary" onClick={handleCreateRoom} disabled={creating}>
              {creating ? 'Creating…' : 'Create Room'}
            </button>
            <Link className="button" to="/join">Join Room</Link>
          </div>
          {error && <p role="alert" className="notice">{error}</p>}
        </div>
      </div>
    </section>
  );
}
