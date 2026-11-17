import { FormEvent, useState } from 'react';
import { User } from 'firebase/auth';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { joinRoom } from '../room/room';

export default function JoinRoom({ user }: { user: User }) {
  const [searchParams] = useSearchParams();
  const [roomIdInput, setRoomIdInput] = useState(searchParams.get('room') || '');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleJoinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const roomId = roomIdInput.trim();
    setJoining(true);
    setError('');
    try {
      await joinRoom(roomId, user);
      navigate('/waiting/' + encodeURIComponent(roomId));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to join this room.');
    } finally {
      setJoining(false);
    }
  }

  return (
    <section className="narrow-page">
      <div className="page-heading">
        <h1>Join a room</h1>
        <p>Enter the room ID from your host.</p>
      </div>
      <form className="panel" onSubmit={handleJoinRoom}>
        <div className="panel-content stack">
          <label className="field-label" htmlFor="room-id">Room ID</label>
          <input id="room-id" className="field" value={roomIdInput} autoCapitalize="none" spellCheck={false}
            onChange={(event) => setRoomIdInput(event.target.value)} required />
          <div className="actions">
            <button className="button button-primary" disabled={joining || !roomIdInput.trim()}>
              {joining ? 'Joining…' : 'Join Room'}
            </button>
            <Link className="button" to="/create">Create a room</Link>
          </div>
          {error && <p role="alert" className="notice">{error}</p>}
        </div>
      </form>
    </section>
  );
}
