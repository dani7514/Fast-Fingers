import { User } from 'firebase/auth';
import { useEffect, useId, useState } from 'react';
import { Link, Navigate, useMatch, useParams } from 'react-router-dom';
import { getRoundStart, racePassage, racePlayers, Room, roundDurations, startRoom, subscribeToRoom, typedInRoom } from '../room/room';
import MultiplayerParagraph from './multiplyPlayer';

export default function RoomPage({ user }: { user: User }) {
  const { roomId } = useParams();
  return <ConnectedRoom key={roomId} roomId={roomId!} user={user} />;
}

function ConnectedRoom({ roomId, user }: { roomId: string; user: User }) {
  const [room, setRoom] = useState<Room | null>();
  const [connectionError, setConnectionError] = useState('');
  const raceRoute = useMatch('/multiplayer/:roomId');

  useEffect(() => subscribeToRoom(roomId, setRoom, () => {
    setConnectionError('Unable to load this room. Check your connection and reload.');
  }), [roomId]);

  if (connectionError) return <p role="alert">{connectionError}</p>;
  if (room === undefined) return <p role="status">Loading room…</p>;
  if (!room) return <p role="alert">Room not found. <Link className="underline" to="/join">Join another room</Link></p>;

  const joinUrl = '/join?room=' + encodeURIComponent(roomId);
  const player = racePlayers(room).find((entry) => entry.uid === user.uid);
  if (!player && room.activePlayerUids) {
    return <p>This rematch is already underway. <Link className="underline" to="/create">Create or join another room</Link></p>;
  }
  if (!player) return <Link className="underline" to={joinUrl}>Join this room</Link>;

  const startsAt = getRoundStart(room);
  if (startsAt !== null) {
    if (!raceRoute) return <Navigate replace to={'/multiplayer/' + encodeURIComponent(roomId)} />;
    return <MultiplayerParagraph roomId={roomId} room={room} user={user}
      startsAt={startsAt} savedInput={typedInRoom(room, player)} />;
  }

  if (raceRoute) return <Navigate replace to={'/waiting/' + encodeURIComponent(roomId)} />;
  return <Lobby roomId={roomId} room={room} uid={user.uid} joinUrl={joinUrl} />;
}

function Lobby({ roomId, room, uid, joinUrl }: { roomId: string; room: Room; uid: string; joinUrl: string }) {
  const inviteId = useId();
  const roomIdField = useId();
  const [duration, setDuration] = useState(roundDurations[0]);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const isHost = room.creator.uid === uid;
  const inviteLink = new URL(joinUrl, window.location.href).href;

  async function handleStart() {
    setStarting(true);
    setError('');
    try {
      await startRoom(roomId, uid, racePassage(duration), duration);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to start the race.');
      setStarting(false);
    }
  }

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(label + ' copied.');
    } catch {
      setCopyStatus('Select the ' + label.toLowerCase() + ' field to copy it manually.');
    }
  }

  return (
    <section className="narrow-page">
      <div className="page-heading">
        <h1>Waiting room</h1>
      </div>
      <div className="panel">
        <div className="panel-content stack">
          <label className="field-label" htmlFor={roomIdField}>Room ID</label>
          <div className="invite-field">
            <input id={roomIdField} className="field" value={roomId} readOnly
              onFocus={(event) => event.currentTarget.select()} />
            <button className="button" type="button" onClick={() => copy(roomId, 'Room ID')}>Copy ID</button>
          </div>
          <label className="field-label" htmlFor={inviteId}>Invite link</label>
          <div className="invite-field">
            <input id={inviteId} className="field" value={inviteLink}
              readOnly onFocus={(event) => event.currentTarget.select()} />
            <button className="button" type="button" onClick={() => copy(inviteLink, 'Invite link')}>Copy Invite</button>
          </div>
          {copyStatus && <p role="status" className="muted">{copyStatus}</p>}
          <h2 className="section-heading">Players ({room.players.length})</h2>
          <ul className="member-list">
            {room.players.map((player) => (
              <li key={player.uid}>
                <span className="member-icon" aria-hidden="true">{player.displayName.slice(0, 1)}</span>
                <span>{player.displayName}{player.uid === room.creator.uid && ' (host)'}</span>
              </li>
            ))}
          </ul>
          {isHost ? (
            <>
              <fieldset disabled={starting}>
                <legend className="field-label mb-2">Race duration</legend>
                <div className="segmented w-fit">
                  {roundDurations.map((seconds) => (
                    <button key={seconds} type="button" aria-pressed={duration === seconds}
                      onClick={() => setDuration(seconds)}>{seconds}s</button>
                  ))}
                </div>
              </fieldset>
              <div className="actions">
                <button className="button button-primary" disabled={starting || room.players.length < 2}
                  onClick={handleStart}>{starting ? 'Starting…' : 'Start Race'}</button>
                {room.players.length < 2 && <p className="muted">Invite another player to start.</p>}
              </div>
            </>
          ) : <p className="muted">Waiting for the host to start the race.</p>}
          {error && <p role="alert" className="notice">{error}</p>}
        </div>
      </div>
    </section>
  );
}
