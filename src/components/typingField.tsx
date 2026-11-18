import { useEffect, useId, useRef, useState } from 'react';

export interface PassageCursor {
  uid: string;
  name: string;
  position: number;
  color: string;
}

interface TypingFieldProps {
  passage: string;
  value: string;
  disabled?: boolean;
  focusWhenReady?: boolean;
  cursors?: PassageCursor[];
  onCursorChange?: (position: number) => void;
  onChange: (value: string) => void;
}

export default function TypingField({ passage, value, disabled = false, focusWhenReady = false, cursors, onCursorChange, onChange }: TypingFieldProps) {
  const inputId = useId();
  const passageId = useId();
  const input = useRef<HTMLTextAreaElement>(null);
  const passageBox = useRef<HTMLParagraphElement>(null);
  const caret = useRef<HTMLSpanElement>(null);
  const [selection, setSelection] = useState(value.length);
  const cursorPosition = Math.min(selection, value.length);
  const cursorGroups = new Map<number, PassageCursor[]>();
  for (const cursor of cursors ?? []) {
    const group = cursorGroups.get(cursor.position) ?? [];
    group.push(cursor);
    cursorGroups.set(cursor.position, group);
  }
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
      onCursorChange?.(typed.length);
    }

    document.addEventListener('keydown', startTyping);
    return () => document.removeEventListener('keydown', startTyping);
  }, [disabled, onChange, onCursorChange, passage, value]);

  useEffect(() => {
    const box = passageBox.current;
    const current = caret.current;
    if (!box || !current) return;
    const bounds = box.getBoundingClientRect();
    const position = current.getBoundingClientRect();
    if (position.bottom > bounds.bottom) box.scrollTop += position.bottom - bounds.bottom;
    if (position.top < bounds.top) box.scrollTop -= bounds.top - position.top;
  }, [passage, value, cursorPosition]);

  function markers(position: number) {
    const group = cursorGroups.get(position);
    if (!group) return null;
    return <span className="race-cursors" aria-hidden="true" style={{ color: group[0].color }}>
      {group.map((cursor) => <span key={cursor.uid} className="race-cursor-name" title={cursor.name}
        data-name={cursor.name} style={{ backgroundColor: cursor.color }} />)}
    </span>;
  }

  function reportSelection(position: number) {
    setSelection(position);
    onCursorChange?.(position);
  }

  return (
    <div className="typing-field" onClick={() => input.current?.focus({ preventScroll: true })}>
      {passage ? (
        <p className={'passage' + (cursorGroups.size ? ' passage-with-cursors' : '')} ref={passageBox} id={passageId}>
          {(passage.match(/\S+ *| +/g) || []).map((word, wordIndex) => {
            const start = offset;
            offset += word.length;
            return <span className="passage-word" key={wordIndex}>
              {word.split('').map((character, index) => {
                const position = start + index;
                const state = value[position] === undefined ? '' : value[position] === character ? ' correct' : ' incorrect';
                const current = position === cursorPosition && !disabled;
                return <span key={index} ref={current ? caret : undefined}
                  className={'passage-letter' + state + (current ? ' current' : '')}>{character}{markers(position)}</span>;
              })}
            </span>;
          })}
          {(cursorPosition === passage.length || cursorGroups.has(passage.length)) && (
            <span className="passage-end" ref={cursorPosition === passage.length ? caret : undefined} aria-hidden="true"
              data-current={cursorPosition === passage.length}>{markers(passage.length)}</span>
          )}
        </p>
      ) : <p className="muted">Typing opens after the countdown.</p>}
      <label className="sr-only" htmlFor={inputId}>Type the passage</label>
      <textarea ref={input} id={inputId} className="typing-input" rows={1}
        aria-describedby={passage ? passageId : undefined} value={value} disabled={disabled}
        maxLength={passage.length} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
        onFocus={(event) => {
          event.currentTarget.setSelectionRange(value.length, value.length);
          reportSelection(value.length);
        }}
        onSelect={(event) => reportSelection(event.currentTarget.selectionStart)}
        onKeyUp={(event) => reportSelection(event.currentTarget.selectionStart)}
        onPaste={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()}
        onChange={(event) => {
          onChange(event.currentTarget.value.replace(/\r?\n/g, ' '));
          reportSelection(event.currentTarget.selectionStart);
        }} />
    </div>
  );
}
