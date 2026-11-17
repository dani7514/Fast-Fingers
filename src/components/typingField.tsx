import { useEffect, useId, useRef, useState } from 'react';

interface TypingFieldProps {
  passage: string;
  value: string;
  disabled?: boolean;
  focusWhenReady?: boolean;
  onChange: (value: string) => void;
}

export default function TypingField({ passage, value, disabled = false, focusWhenReady = false, onChange }: TypingFieldProps) {
  const inputId = useId();
  const passageId = useId();
  const input = useRef<HTMLTextAreaElement>(null);
  const passageBox = useRef<HTMLParagraphElement>(null);
  const caret = useRef<HTMLSpanElement>(null);
  const [selection, setSelection] = useState(value.length);
  const cursorPosition = Math.min(selection, value.length);
  let offset = 0;

  useEffect(() => {
    if (focusWhenReady && !disabled) input.current?.focus({ preventScroll: true });
  }, [disabled, focusWhenReady]);

  useEffect(() => {
    if (disabled || !passage) return;

    function startTyping(event: KeyboardEvent) {
      const field = input.current;
      if (!field || document.activeElement === field || event.defaultPrevented || event.isComposing
        || event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;

      const focused = document.activeElement;
      if (focused?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]')) return;
      if (event.key === ' ' && focused?.closest('button, a[href], [role="button"]')) return;
      if (value.length >= passage.length) return;

      event.preventDefault();
      field.focus({ preventScroll: true });
      const typed = value + event.key;
      setSelection(typed.length);
      onChange(typed);
    }

    document.addEventListener('keydown', startTyping);
    return () => document.removeEventListener('keydown', startTyping);
  }, [disabled, onChange, passage, value]);

  useEffect(() => {
    const box = passageBox.current;
    const current = caret.current;
    if (!box || !current) return;
    const bounds = box.getBoundingClientRect();
    const position = current.getBoundingClientRect();
    if (position.bottom > bounds.bottom) box.scrollTop += position.bottom - bounds.bottom;
    if (position.top < bounds.top) box.scrollTop -= bounds.top - position.top;
  }, [passage, value, cursorPosition]);

  return (
    <div className="typing-field" onClick={() => input.current?.focus({ preventScroll: true })}>
      {passage ? (
        <p className="passage" ref={passageBox} id={passageId}>
          {(passage.match(/\S+ *| +/g) || []).map((word, wordIndex) => {
            const start = offset;
            offset += word.length;
            return <span className="passage-word" key={wordIndex}>
              {word.split('').map((character, index) => {
                const position = start + index;
                const state = value[position] === undefined ? '' : value[position] === character ? ' correct' : ' incorrect';
                const current = position === cursorPosition && !disabled;
                return <span key={index} ref={current ? caret : undefined}
                  className={'passage-letter' + state + (current ? ' current' : '')}>{character}</span>;
              })}
            </span>;
          })}
          {cursorPosition === passage.length && <span className="passage-end current" ref={caret} aria-hidden="true" />}
        </p>
      ) : <p className="muted">Typing opens after the countdown.</p>}
      <label className="sr-only" htmlFor={inputId}>Type the passage</label>
      <textarea ref={input} id={inputId} className="typing-input" rows={1}
        aria-describedby={passage ? passageId : undefined} value={value} disabled={disabled}
        maxLength={passage.length} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
        onFocus={(event) => {
          event.currentTarget.setSelectionRange(value.length, value.length);
          setSelection(value.length);
        }}
        onSelect={(event) => setSelection(event.currentTarget.selectionStart)}
        onPaste={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()}
        onChange={(event) => {
          setSelection(event.currentTarget.selectionStart);
          onChange(event.currentTarget.value.replace(/\r?\n/g, ' '));
        }} />
    </div>
  );
}
