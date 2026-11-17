import { useEffect, useRef, useState } from 'react';
import { FirebaseError } from 'firebase/app';
import { Navigate } from 'react-router-dom';
import { Room, saveProgress, scoreTyping, startRematch, typedInRoom } from '../room/room';
import TypingField from './typingField';

interface RaceProps {
  roomId: string;
  room: Room;
  uid: string;
  startsAt: number;
  savedInput: string;
}

export default function MultiplayerParagraph({ roomId, room, uid, startsAt, savedInput }: RaceProps) {
  const [input, setInput] = useState(savedInput);
  const [now, setNow] = useState(Date.now);
  const [saveError, setSaveError] = useState(false);
  const [confirmedInput, setConfirmedInput] = useState(savedInput);
  const [openingRematch, setOpeningRematch] = useState(false);
  const [rematchError, setRematchError] = useState('');
  const latestInput = useRef(savedInput);
  const syncedInput = useRef(savedInput);
  const pendingSave = useRef<Promise<void>>();
  const endsAt = startsAt + room.timeInSeconds * 1000;
  const finished = now >= endsAt;
  const racing = now >= startsAt && !finished;

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
      await startRematch(roomId, uid);
    } catch (error) {
      setRematchError(error instanceof FirebaseError && error.code === 'permission-denied'
        ? 'Firestore denied the rematch. Publish the updated room rules and try again.'
        : error instanceof Error ? error.message : 'Unable to start the rematch.');
    } finally {
      setOpeningRematch(false);
    }
  }

  if (room.nextRoomId && finished && (input === confirmedInput || saveError)) {
    return <Navigate replace to={'/multiplayer/' + encodeURIComponent(room.nextRoomId)} />;
  }

  const remaining = Math.max(0, endsAt - now);
  const leaderboard = room.players.map((player) => {
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
            {input === confirmedInput && (
              <button className="button button-primary" type="button" disabled={openingRematch} onClick={playAgain}>
                {openingRematch ? 'Starting rematch…' : 'Play again'}
              </button>
            )}
            {input !== confirmedInput && !saveError && <p role="status" className="muted">Saving your result…</p>}
            <span className="muted">Play again starts a rematch for everyone.</span>
          </footer>
        )}
      </div>
    </section>
  );
}
