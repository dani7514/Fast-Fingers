import { useEffect, useRef, useState } from 'react';
import { FirebaseError } from 'firebase/app';
import { User } from 'firebase/auth';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { createRoom, racePlayers, Room, saveProgress, scoreTyping, startRematch, trackRacePresence, typedInRoom } from '../room/room';
import TypingField from './typingField';

interface RaceProps {
  roomId: string;
  room: Room;
  user: User;
  startsAt: number;
  savedInput: string;
}

export default function MultiplayerParagraph({ roomId, room, user, startsAt, savedInput }: RaceProps) {
  const { uid } = user;
  const navigate = useNavigate();
  const [input, setInput] = useState(savedInput);
  const [now, setNow] = useState(Date.now);
  const [saveError, setSaveError] = useState(false);
  const [confirmedInput, setConfirmedInput] = useState(savedInput);
  const [openingRematch, setOpeningRematch] = useState(false);
  const [rematchError, setRematchError] = useState('');
  const [friendsLeft, setFriendsLeft] = useState(false);
  const [inviting, setInviting] = useState(false);
  const latestInput = useRef(savedInput);
  const syncedInput = useRef(savedInput);
  const pendingSave = useRef<Promise<void>>();
  const endsAt = startsAt + room.timeInSeconds * 1000;
  const finished = now >= endsAt;
  const racing = now >= startsAt && !finished;
  const playerIndex = room.players.findIndex((player) => player.uid === uid);
  const rematchRoomId = !room.nextPlayerUids || room.nextPlayerUids.includes(uid) ? room.nextRoomId : undefined;

  useEffect(() => trackRacePresence(roomId, uid, playerIndex), [roomId, uid, playerIndex]);

  useEffect(() => {
    if (finished) return;
    const interval = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(interval);
  }, [finished]);

  useEffect(() => {
    if (saveError) return;
    let active = true;

    async function syncProgress() {
      if (pendingSave.current) await pendingSave.current;
      const value = latestInput.current;
      if (!active || pendingSave.current || value === syncedInput.current) return;

      pendingSave.current = saveProgress(roomId, uid, value)
        .then(() => {
          syncedInput.current = value;
          setConfirmedInput(value);
        })
        .catch(() => { if (active) setSaveError(true); })
        .finally(() => { pendingSave.current = undefined; });
    }

    // Publish during the race and flush the latest edit when the timer ends.
    void syncProgress();
    const interval = finished ? undefined : window.setInterval(syncProgress, 750);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [finished, roomId, saveError, uid]);

  async function playAgain() {
    setOpeningRematch(true);
    setRematchError('');
    try {
      setFriendsLeft(await startRematch(roomId, uid) === 'alone');
    } catch (error) {
      setRematchError(error instanceof FirebaseError && error.code === 'permission-denied'
        ? 'Firestore denied the rematch. Publish the updated room rules and try again.'
        : error instanceof Error ? error.message : 'Unable to start the rematch.');
    } finally {
      setOpeningRematch(false);
    }
  }

  async function inviteFriends() {
    setInviting(true);
    setRematchError('');
    try {
      const newRoomId = await createRoom(user);
      navigate('/waiting/' + encodeURIComponent(newRoomId));
    } catch {
      setRematchError('Unable to create a new room. Try again.');
      setInviting(false);
    }
  }

  if (rematchRoomId && finished && (input === confirmedInput || saveError)) {
    return <Navigate replace to={'/multiplayer/' + encodeURIComponent(rematchRoomId)} />;
  }

  const remaining = Math.max(0, endsAt - now);
  const leaderboard = racePlayers(room).map((player) => {
    const typed = player.uid === uid ? input : typedInRoom(room, player);
    return { player, ...scoreTyping(room.paragraph, typed, room.timeInSeconds), typed: typed.length };
  }).sort((a, b) => b.correct - a.correct || b.accuracy - a.accuracy);

  return (
    <section>
      <div className="page-heading">
        <h1>{finished ? 'Race results' : 'Typing race'}</h1>
        <p>{finished ? room.timeInSeconds + '-second race' : 'Type the shared passage before the clock runs out.'}</p>
      </div>
      {!finished && (
        <div className="panel">
          <div className="panel-bar">
            <h2>Race passage</h2>
            <p role="timer" className="race-timer">
              {racing
                ? Math.ceil(remaining / 1000) + 's left'
                : 'Starts in ' + Math.ceil((startsAt - now) / 1000)}
            </p>
          </div>
          <div className="time-track" aria-hidden="true">
            <div style={{ width: Math.min(100, (remaining / (room.timeInSeconds * 1000)) * 100) + '%' }} />
          </div>
          <div className="panel-content">
            <TypingField passage={racing ? room.paragraph : ''} value={input} disabled={!racing} focusWhenReady
              onChange={(value) => {
                if (Date.now() < startsAt || Date.now() >= endsAt) return;
                latestInput.current = value;
                setInput(value);
              }} />
          </div>
        </div>
      )}
      <div className="panel score-panel">
        <div className="panel-bar">
          <h2>{finished ? 'Leaderboard' : 'Player progress'}</h2>
        </div>
        <div className="panel-content stack">
          <ol className="stack">
            {leaderboard.map(({ player, correct, accuracy, wpm, typed }, index) => (
              <li key={player.uid} className="score-row">
                <p className="font-bold">
                  {finished && <span className="rank" aria-label={'Rank ' + (index + 1)}>{index + 1}</span>}
                  {player.displayName}{player.uid === uid && ' (you)'}
                </p>
                <p>{finished ? wpm + ' WPM · ' + accuracy + '% accuracy · ' + correct + ' correct characters'
                  : correct + ' correct of ' + typed + ' typed'}</p>
              </li>
            ))}
          </ol>
          {saveError && <div role="alert" className="notice">
            Progress could not be synced. <button className="underline" onClick={() => setSaveError(false)}>Retry</button>
          </div>}
          {rematchError && <p role="alert" className="notice">{rematchError}</p>}
        </div>
        {finished && (
          <footer className="panel-footer">
            {friendsLeft || (room.nextRoomId && !rematchRoomId) ? (
              <div className="stack">
                <p role="status">{friendsLeft ? 'Your friends have left the room.' : 'Your friends started a rematch.'}</p>
                <div className="actions">
                  <Link className="button" to="/">Practice solo</Link>
                  <button className="button button-primary" type="button" disabled={inviting} onClick={inviteFriends}>
                    {inviting ? 'Creating room…' : 'Invite friends'}
                  </button>
                </div>
              </div>
            ) : input === confirmedInput && (
              <button className="button button-primary" type="button" disabled={openingRematch} onClick={playAgain}>
                {openingRematch ? 'Starting rematch…' : 'Play again'}
              </button>
            )}
            {input !== confirmedInput && !saveError && <p role="status" className="muted">Saving your result…</p>}
            {!friendsLeft && !room.nextRoomId && <span className="muted">Play again starts a rematch with players who are still here.</span>}
          </footer>
        )}
      </div>
    </section>
  );
}
