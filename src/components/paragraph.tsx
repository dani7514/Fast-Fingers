import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { racePassage, roundDurations, scoreTyping } from '../room/room';
import TypingField from './typingField';

export default function Paragraph() {
  const [duration, setDuration] = useState(roundDurations[0]);
  const [passage, setPassage] = useState(() => racePassage(roundDurations[0]));
  const [input, setInput] = useState('');
  const [startsAt, setStartsAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now);

  const remaining = startsAt === null ? duration * 1000 : Math.max(0, startsAt + duration * 1000 - now);
  const finished = remaining === 0;
  const active = startsAt !== null && !finished;
  const elapsed = startsAt === null ? 0 : Math.min(duration, (now - startsAt) / 1000);
  const { accuracy, correct, wpm } = scoreTyping(passage, input, Math.max(1, elapsed));

  useEffect(() => {
    if (!active) return;
    const interval = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(interval);
  }, [active]);

  function restart(seconds = duration) {
    setDuration(seconds);
    setPassage(racePassage(seconds));
    setInput('');
    setStartsAt(null);
  }

  function type(value: string) {
    const time = Date.now();
    if (startsAt !== null && time >= startsAt + duration * 1000) return;
    setInput(value);
    if (startsAt === null && value) {
      setStartsAt(time);
      setNow(time);
    }
  }

  return (
    <>
      <section className="practice-hero">
        <div>
          <h1>Find your <em>rhythm.</em></h1>
          <p>Practice at your own pace or race your friends in real time.</p>
        </div>
        <div className="hero-keys" aria-hidden="true">
          <span>F</span><span>A</span><span>S</span><span>T</span>
        </div>
      </section>
      <section className="panel practice-panel" aria-labelledby="practice-heading">
        <div className="panel-bar">
          <h2 id="practice-heading">{finished ? 'Test results' : 'Typing test'}</h2>
          <div className="segmented" role="group" aria-label="Test duration">
            {roundDurations.map((seconds) => <button type="button" key={seconds}
              aria-pressed={duration === seconds} onClick={() => restart(seconds)}>{seconds}s</button>)}
          </div>
        </div>
        <div className="stats">
          <div><span>{finished ? 'Duration' : 'Time left'}</span><strong className="accent" role={finished ? undefined : 'timer'}>{Math.ceil(remaining / 1000) || duration}<small>s</small></strong></div>
          <div><span>Speed</span><strong>{wpm}<small> WPM</small></strong></div>
          <div><span>Accuracy</span><strong>{input ? accuracy + '%' : '—'}</strong></div>
        </div>
        <div className="time-track" aria-hidden="true"><div style={{ width: (remaining / (duration * 1000)) * 100 + '%' }} /></div>
        <div className="panel-content">
          {finished
            ? <p className="result-summary">{correct} correct characters out of {input.length} typed.</p>
            : <TypingField passage={passage} value={input} onChange={type} />}
        </div>
        <footer className="panel-footer">
          <button type="button" className="button" onClick={() => restart()}>
            <span aria-hidden="true">↻</span> {finished ? 'Try again' : 'Restart test'}
          </button>
          {!finished && <span className="muted">Start typing, or tap the passage to open the keyboard.</span>}
        </footer>
      </section>
      <div className="race-callout">
        <div><h2>Race your friends</h2><p>Same passage, shared countdown, live scores.</p></div>
        <Link className="button button-primary" to="/create">Play with Friends <span aria-hidden="true">↗</span></Link>
      </div>
    </>
  );
}
