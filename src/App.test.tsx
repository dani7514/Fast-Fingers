import { act, fireEvent, render, within } from '@testing-library/react';
import { FirebaseError } from 'firebase/app';
import { User } from 'firebase/auth';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RoomCreation from './components/createRoom';
import JoinRoom from './components/joinRoom';
import Paragraph from './components/paragraph';
import RoomPage from './components/waiting';

jest.mock('./config/firebase.config', () => ({ db: {} }));
const mockBeforeAddDoc = jest.fn();
jest.mock('firebase/firestore', () => {
  const rooms = new Map<string, Record<string, unknown>>();
  const presence = new Map<string, Record<string, unknown>>();
  let nextId = 0;
  let createdRooms = 0;
  const snapshot = (id: string) => {
    const room = rooms.get(id);
    return { exists: () => !!room, data: () => room };
  };
  const listeners = new Map<string, Set<(mockValue: ReturnType<typeof snapshot>) => void>>();
  const write = (id: string, data: Record<string, unknown>) => {
    rooms.set(id, data);
    listeners.get(id)?.forEach((listener) => listener(snapshot(id)));
  };
  return {
    collection: (_database: unknown, ...segments: string[]) => segments.join('/'),
    doc: (collection: unknown, _name?: string, id?: string) => ({
      id: id ?? 'rematch-' + ++nextId, collection,
    }),
    addDoc: async (_collection: unknown, data: Record<string, unknown>) => {
      await mockBeforeAddDoc();
      const id = createdRooms++ === 0 ? 'test-room' : 'new-room-' + createdRooms;
      write(id, data);
      return { id };
    },
    setDoc: async ({ collection, id }: { collection: string; id: string }, data: Record<string, unknown>) => {
      presence.set(collection + '/' + id, data);
    },
    deleteDoc: async ({ collection, id }: { collection: string; id: string }) => {
      presence.delete(collection + '/' + id);
    },
    getDocsFromServer: async (collection: string) => ({
      docs: Array.from(presence.entries())
        .filter(([path]) => path.startsWith(collection + '/'))
        .map(([, data]) => ({ data: () => data })),
    }),
    onSnapshot: ({ id }: { id: string }, listener: (mockValue: ReturnType<typeof snapshot>) => void) => {
      const subscribers = listeners.get(id) || new Set<typeof listener>();
      listeners.set(id, subscribers);
      subscribers.add(listener);
      listener(snapshot(id));
      return () => subscribers.delete(listener);
    },
    runTransaction: (database: unknown, callback: (mockTransaction: unknown) => Promise<unknown>) => {
      return callback({
        get: async ({ id }: { id: string }) => snapshot(id),
        set: ({ id }: { id: string }, data: Record<string, unknown>) => write(id, data),
        update: ({ id }: { id: string }, data: Record<string, unknown>) => write(id, { ...rooms.get(id), ...data }),
      });
    },
    serverTimestamp: () => {
      const now = Date.now();
      return { toMillis: () => now };
    },
  };
});

afterEach(() => jest.useRealTimers());

test('practice starts on typing and can restart from the results', () => {
  jest.useFakeTimers();
  const { getByRole, queryByRole } = render(<MemoryRouter><Paragraph /></MemoryRouter>);
  expect(getByRole('timer')).toHaveTextContent('15s');
  act(() => { jest.advanceTimersByTime(1000); });
  expect(getByRole('timer')).toHaveTextContent('15s');

  const field = getByRole('textbox', { name: 'Type the passage' });
  const passage = document.getElementById(field.getAttribute('aria-describedby')!)!;
  const firstLetter = passage.textContent!.charAt(0);
  fireEvent.keyDown(document.body, { key: firstLetter, ctrlKey: true });
  expect(field).toHaveValue('');
  fireEvent.keyDown(document.body, { key: firstLetter });
  expect(field).toHaveFocus();
  expect(field).toHaveValue(firstLetter);
  fireEvent.change(field, { target: { value: passage.textContent!.slice(0, 5) } });
  expect(passage.querySelectorAll('.passage-letter.correct')).toHaveLength(5);
  expect(passage.querySelector('.passage-letter.current')).toHaveTextContent(passage.textContent!.charAt(5), { normalizeWhitespace: false });
  act(() => { jest.advanceTimersByTime(15000); });
  expect(getByRole('heading', { name: 'Test results' })).toBeInTheDocument();
  expect(queryByRole('textbox')).toBeNull();

  fireEvent.click(getByRole('button', { name: 'Try again' }));
  expect(getByRole('textbox')).toHaveValue('');
  expect(getByRole('timer')).toHaveTextContent('15s');
});

test('shows when Firestore rules deny room creation', async () => {
  mockBeforeAddDoc.mockRejectedValueOnce(new FirebaseError('permission-denied', 'Missing permissions.'));
  const { getByRole, findByRole } = render(
    <MemoryRouter>
      <RoomCreation user={{ uid: 'host' } as User} />
    </MemoryRouter>,
  );

  fireEvent.click(getByRole('button', { name: 'Create Room' }));
  expect(await findByRole('alert')).toHaveTextContent('permission-denied');
});

test('one player can start a rematch for everyone in the race', async () => {
  jest.useFakeTimers();

  function client(uid: string, displayName: string, path: string) {
    const user = { uid, displayName } as User;
    return (
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/create" element={<RoomCreation user={user} />} />
          <Route path="/join" element={<JoinRoom user={user} />} />
          <Route path="/waiting/:roomId" element={<RoomPage user={user} />} />
          <Route path="/multiplayer/:roomId" element={<RoomPage user={user} />} />
        </Routes>
      </MemoryRouter>
    );
  }

  const hostView = render(client('host', 'Host', '/create'));
  const hostUI = within(hostView.container);
  await act(async () => { fireEvent.click(hostUI.getByRole('button', { name: 'Create Room' })); });
  expect(hostUI.getByRole('button', { name: 'Start Race' })).toBeDisabled();
  expect(hostUI.getByRole('button', { name: '120s' })).toHaveAttribute('aria-pressed', 'false');

  const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  try {
    expect(hostUI.getByRole('textbox', { name: 'Room ID' })).toHaveValue('test-room');
    await act(async () => { fireEvent.click(hostUI.getByRole('button', { name: 'Copy ID' })); });
    expect(writeText).toHaveBeenCalledWith('test-room');
    expect(hostUI.getByRole('status')).toHaveTextContent('Room ID copied.');
  } finally {
    if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
    else Reflect.deleteProperty(navigator, 'clipboard');
  }

  const invite = new URL((hostUI.getByLabelText('Invite link') as HTMLInputElement).value);
  const guestView = render(client('guest', 'Guest', invite.pathname + invite.search));
  const guestUI = within(guestView.container);
  expect(guestUI.getByRole('textbox', { name: 'Room ID' })).toHaveValue('test-room');
  await act(async () => { fireEvent.click(guestUI.getByRole('button', { name: 'Join Room' })); });
  expect(guestUI.getByText('Waiting for the host to start the race.')).toBeInTheDocument();
  expect(guestUI.queryByRole('button', { name: 'Start Race' })).toBeNull();

  await act(async () => { fireEvent.click(hostUI.getByRole('button', { name: 'Start Race' })); });
  expect(hostUI.getByRole('timer')).toHaveTextContent('Starts in 3');
  expect(guestUI.getByRole('timer')).toHaveTextContent('Starts in 3');
  expect(guestUI.getByRole('textbox', { name: 'Type the passage' })).toBeDisabled();

  act(() => { jest.advanceTimersByTime(3000); });
  expect(hostUI.getByRole('timer')).toHaveTextContent('15s left');
  expect(guestUI.getByRole('timer')).toHaveTextContent('15s left');
  const hostPassageId = hostUI.getByRole('textbox').getAttribute('aria-describedby')!;
  const guestPassageId = guestUI.getByRole('textbox').getAttribute('aria-describedby')!;
  const paragraph = document.getElementById(hostPassageId)?.textContent || '';
  expect(paragraph).not.toBe('');
  expect(document.getElementById(guestPassageId)).toHaveTextContent(paragraph);

  const guestInput = guestUI.getByRole('textbox') as HTMLTextAreaElement;
  fireEvent.change(guestInput, { target: { value: paragraph.slice(0, 5) } });
  expect(guestUI.getByLabelText('Your live score')).toHaveTextContent('60 WPM100% accuracy');
  await act(async () => { jest.advanceTimersByTime(750); });
  expect(hostUI.getByText('5 correct of 5 typed')).toBeInTheDocument();
  expect(hostUI.getByRole('progressbar', { name: 'Guest passage progress' })).toHaveAttribute('value', '5');
  const hostPassage = document.getElementById(hostPassageId)!;
  const letters = hostPassage.querySelectorAll('.passage-letter');
  expect(letters[5].querySelector('[data-name="Guest"]')).toBeInTheDocument();
  guestInput.setSelectionRange(2, 2);
  fireEvent.keyUp(guestInput, { key: 'ArrowLeft' });
  await act(async () => { jest.advanceTimersByTime(750); });
  expect(letters[2].querySelector('[data-name="Guest"]')).toBeInTheDocument();

  act(() => { jest.advanceTimersByTime(13450); });
  fireEvent.change(guestUI.getByRole('textbox'), { target: { value: paragraph.slice(0, 10) } });
  await act(async () => { jest.advanceTimersByTime(50); });

  expect(hostUI.getByRole('heading', { name: 'Finalizing results' })).toBeInTheDocument();
  expect(guestUI.queryByRole('heading', { name: 'Leaderboard' })).toBeNull();
  expect(guestUI.queryByRole('button', { name: 'Play again' })).toBeNull();
  await act(async () => { jest.advanceTimersByTime(5000); });

  expect(hostUI.getByRole('heading', { name: 'Race results' })).toBeInTheDocument();
  expect(guestUI.queryByRole('textbox')).toBeNull();
  expect(hostUI.getByText('8 WPM · 100% accuracy · 10 correct characters')).toBeInTheDocument();
  expect(guestUI.getByText('8 WPM · 100% accuracy · 10 correct characters')).toBeInTheDocument();

  await act(async () => { fireEvent.click(guestUI.getByRole('button', { name: 'Play again' })); });
  expect(hostUI.getByRole('timer')).toHaveTextContent('Starts in 3');
  expect(guestUI.getByRole('timer')).toHaveTextContent('Starts in 3');
  expect(hostUI.getAllByText('0 correct of 0 typed')).toHaveLength(2);
  act(() => { jest.advanceTimersByTime(3000); });
  expect(guestUI.getByRole('textbox')).toHaveValue('');
  const rematchPassage = document.getElementById(guestUI.getByRole('textbox').getAttribute('aria-describedby')!)!.textContent!;
  fireEvent.change(guestUI.getByRole('textbox'), { target: { value: rematchPassage.slice(0, 5) } });
  await act(async () => { jest.advanceTimersByTime(750); });
  expect(hostUI.getByText('5 correct of 5 typed')).toBeInTheDocument();

  hostView.unmount();
  await act(async () => { jest.advanceTimersByTime(19250); });
  await act(async () => { fireEvent.click(guestUI.getByRole('button', { name: 'Play again' })); });
  expect(guestUI.getByRole('status')).toHaveTextContent('Your friends have left the room.');
  expect(guestUI.getByRole('link', { name: 'Practice solo' })).toHaveAttribute('href', '/');
  expect(guestUI.queryByRole('timer')).toBeNull();

  await act(async () => { fireEvent.click(guestUI.getByRole('button', { name: 'Invite friends' })); });
  expect(guestUI.getByRole('heading', { name: 'Waiting room' })).toBeInTheDocument();
  expect(guestUI.getByRole('textbox', { name: 'Room ID' })).toHaveValue('new-room-2');
  guestView.unmount();
});
