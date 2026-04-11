import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';
import type {
  Question,
  QuestionSet,
  GameSession,
  LifelineUsage,
  OverlayState,
  LifelineType,
} from '@/types/game';

// ─── Types ───────────────────────────────────────────────────────────────────

interface GameStore {
  // Data
  questionSets: QuestionSet[];
  session: GameSession | null;
  lifelines: LifelineUsage[];
  overlayState: OverlayState;
  loading: boolean;

  // Bootstrap
  loadQuestionSets: () => Promise<void>;

  // Admin game actions
  createSession: (setId: string) => Promise<void>;
  startGame: () => Promise<void>;
  nextQuestion: () => Promise<void>;
  revealAnswer: () => Promise<void>;
  finishGame: () => Promise<void>;
  useLifeline: (type: LifelineType) => Promise<void>;
  resetGame: () => void;

  // Question set CRUD
  addQuestionSet: (name: string) => Promise<void>;
  deleteQuestionSet: (id: string) => Promise<void>;
  addQuestion: (setId: string, question: Omit<Question, 'id'>) => Promise<void>;
  updateQuestion: (question: Question) => Promise<void>;
  deleteQuestion: (setId: string, questionId: string) => Promise<void>;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initialOverlay: OverlayState = {
  id: 'main',
  revealAnswer: false,
  hiddenAnswerIds: [],
  gameFinished: false,
};

// ─── WebSocket setup (singleton, shared between admin and overlay) ─────────────

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
const role =
  typeof window !== 'undefined' && window.location.pathname.includes('/admin')
    ? 'admin'
    : 'overlay';
const isDemo =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('demo') === 'true';

let socket: Socket | null = null;
if (typeof window !== 'undefined' && !isDemo) {
  socket = io(`${API_URL}/ws/game`, {
    query: { role },
    transports: ['websocket', 'polling'],
  });
}

// BroadcastChannel for same-browser tab sync (admin → overlay in same browser)
const channel =
  typeof window !== 'undefined' ? new BroadcastChannel('game_sync_channel') : null;

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => ({
  questionSets: [],
  session: null,
  lifelines: [],
  overlayState: initialOverlay,
  loading: false,

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  loadQuestionSets: async () => {
    set({ loading: true });
    try {
      const sets = await apiClient.get<QuestionSet[]>('/question-sets');
      const setsWithQuestions = await Promise.all(
        sets.map(async (s) => {
          const questions = await apiClient.get<Question[]>(`/questions?setId=${s.id}`);
          return { ...s, questions };
        }),
      );
      set({ questionSets: setsWithQuestions });
    } catch (err) {
      toast.error('Error loading question sets');
    } finally {
      set({ loading: false });
    }
  },

  // ── Game actions ───────────────────────────────────────────────────────────

  createSession: async (setId: string) => {
    set({ loading: true });
    try {
      const session = await apiClient.post<GameSession>('/game/session', { setId });
      const lifelines = await apiClient.get<LifelineUsage[]>(
        `/lifelines/session/${session.id}`,
      );
      set({
        session,
        lifelines,
        overlayState: { ...initialOverlay, sessionId: session.id },
      });
      // Join the game room so we receive backend WS events for this session
      socket?.emit('JOIN_GAME', { sessionId: session.id });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      set({ loading: false });
    }
  },

  startGame: async () => {
    const { session } = get();
    if (!session) return;
    set({ loading: true });
    try {
      await apiClient.post(`/game/session/${session.id}/start`);
      set({ session: { ...session, status: 'PLAYING' } });
      // Auto-load first question right after starting
      await apiClient.post(`/game/session/${session.id}/next`);
      // Backend emits GAME_STARTED + SHOW_QUESTION via WS
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start game');
    } finally {
      set({ loading: false });
    }
  },

  nextQuestion: async () => {
    const { session } = get();
    if (!session) return;
    set({ loading: true });
    try {
      await apiClient.post(`/game/session/${session.id}/next`);
      // Backend emits SHOW_QUESTION via WS — overlayState updated in WS listener
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to advance question');
    } finally {
      set({ loading: false });
    }
  },

  revealAnswer: async () => {
    const { session } = get();
    if (!session) return;
    set({ loading: true });
    try {
      await apiClient.post(`/game/session/${session.id}/reveal-answer`);
      // Backend emits REVEAL_CORRECT via WS — overlayState updated in WS listener
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reveal answer');
    } finally {
      set({ loading: false });
    }
  },

  finishGame: async () => {
    const { session } = get();
    if (!session) return;
    set({ loading: true });
    try {
      await apiClient.post(`/game/session/${session.id}/finish`);
      set({ session: { ...session, status: 'FINISHED' } });
      // Backend emits GAME_FINISHED via WS — overlayState updated in WS listener
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to finish game');
    } finally {
      set({ loading: false });
    }
  },

  useLifeline: async (type: LifelineType) => {
    const { session, lifelines } = get();
    if (!session || !session.currentQuestionId) return;
    const lifeline = lifelines.find((l) => l.type === type && !l.used);
    if (!lifeline) return;

    const endpointMap: Record<LifelineType, string> = {
      FIFTY_FIFTY: '/lifelines/fifty-fifty',
      ASK_AUDIENCE: '/lifelines/ask-audience',
      PHONE_FRIEND: '/lifelines/phone-friend',
    };

    set({ loading: true });
    try {
      await apiClient.post(endpointMap[type], {
        sessionId: session.id,
        questionId: session.currentQuestionId,
      });
      // Backend emits HIDE_ANSWERS (for 50/50) via WS — overlayState updated there
      // Optimistically mark lifeline as used in local state
      set({
        lifelines: lifelines.map((l) =>
          l.id === lifeline.id ? { ...l, used: true, usedAt: new Date().toISOString() } : l,
        ),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to use lifeline');
    } finally {
      set({ loading: false });
    }
  },

  resetGame: () => {
    const { session } = get();
    if (session) {
      socket?.emit('LEAVE_GAME', { sessionId: session.id });
    }
    set({ session: null, lifelines: [], overlayState: { ...initialOverlay } });
  },

  // ── Question set CRUD ──────────────────────────────────────────────────────

  addQuestionSet: async (name: string) => {
    try {
      const newSet = await apiClient.post<QuestionSet>('/question-sets', { name });
      set({ questionSets: [...get().questionSets, { ...newSet, questions: [] }] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create question set');
    }
  },

  deleteQuestionSet: async (id: string) => {
    try {
      await apiClient.delete(`/question-sets/${id}`);
      set({ questionSets: get().questionSets.filter((s) => s.id !== id) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete question set');
    }
  },

  addQuestion: async (setId: string, question: Omit<Question, 'id'>) => {
    try {
      const created = await apiClient.post<Question>('/questions', {
        text: question.text,
        level: question.level,
        category: question.category,
        setId,
        answers: question.answers.map((a) => ({ text: a.text, isCorrect: a.isCorrect ?? false })),
      });
      set({
        questionSets: get().questionSets.map((s) =>
          s.id === setId
            ? { ...s, questions: [...s.questions, created], updatedAt: new Date().toISOString() }
            : s,
        ),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add question');
    }
  },

  updateQuestion: async (question: Question) => {
    try {
      const updated = await apiClient.patch<Question>(`/questions/${question.id}`, {
        text: question.text,
        level: question.level,
        category: question.category,
        answers: question.answers.map((a) => ({ text: a.text, isCorrect: a.isCorrect ?? false })),
      });
      set({
        questionSets: get().questionSets.map((s) =>
          s.id === question.setId
            ? {
                ...s,
                questions: s.questions.map((q) => (q.id === question.id ? updated : q)),
                updatedAt: new Date().toISOString(),
              }
            : s,
        ),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update question');
    }
  },

  deleteQuestion: async (setId: string, questionId: string) => {
    try {
      await apiClient.delete(`/questions/${questionId}`);
      set({
        questionSets: get().questionSets.map((s) =>
          s.id === setId
            ? { ...s, questions: s.questions.filter((q) => q.id !== questionId) }
            : s,
        ),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete question');
    }
  },
}));

// ─── WebSocket event listeners ────────────────────────────────────────────────

if (socket) {
  socket.on('SHOW_QUESTION', (data: { sessionId: string; question: Question }) => {
    const currentSession = useGameStore.getState().session;
    if (currentSession && data.sessionId !== currentSession.id) return;
    const newOverlay: OverlayState = {
      ...useGameStore.getState().overlayState,
      currentQuestion: { ...data.question, answers: data.question.answers },
      revealAnswer: false,
      hiddenAnswerIds: [],
      correctAnswerId: undefined,
      gameFinished: false,
    };
    useGameStore.setState({ overlayState: newOverlay });
    channel?.postMessage(JSON.stringify(newOverlay));
  });

  socket.on('HIDE_ANSWERS', (data: { sessionId: string; hiddenAnswerIds: string[] }) => {
    const currentSession = useGameStore.getState().session;
    if (currentSession && data.sessionId !== currentSession.id) return;
    const newOverlay: OverlayState = {
      ...useGameStore.getState().overlayState,
      hiddenAnswerIds: data.hiddenAnswerIds,
    };
    useGameStore.setState({ overlayState: newOverlay });
    channel?.postMessage(JSON.stringify(newOverlay));
  });

  socket.on('REVEAL_CORRECT', (data: { sessionId: string; correctAnswerId: string }) => {
    const currentSession = useGameStore.getState().session;
    if (currentSession && data.sessionId !== currentSession.id) return;
    const newOverlay: OverlayState = {
      ...useGameStore.getState().overlayState,
      revealAnswer: true,
      correctAnswerId: data.correctAnswerId,
    };
    useGameStore.setState({ overlayState: newOverlay });
    channel?.postMessage(JSON.stringify(newOverlay));
  });

  socket.on('GAME_STARTED', (_data: { sessionId: string }) => {
    useGameStore.setState((state) => ({
      session: state.session ? { ...state.session, status: 'PLAYING' } : state.session,
    }));
  });

  socket.on('GAME_FINISHED', (data: { sessionId: string; finalLevel: number }) => {
    const currentSession = useGameStore.getState().session;
    if (currentSession && data.sessionId !== currentSession.id) return;
    const newOverlay: OverlayState = {
      ...useGameStore.getState().overlayState,
      gameFinished: true,
      currentQuestion: undefined,
    };
    useGameStore.setState((state) => ({
      session: state.session ? { ...state.session, status: 'FINISHED' } : state.session,
      overlayState: newOverlay,
    }));
    channel?.postMessage(JSON.stringify(newOverlay));
  });

  // OVERLAY_STATE: used by the overlay on reconnection (OBS browser source reload)
  socket.on('OVERLAY_STATE', (data: unknown) => {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (
        role === 'overlay' &&
        parsed &&
        typeof parsed === 'object' &&
        'overlayState' in parsed
      ) {
        useGameStore.setState({
          overlayState: (parsed as { overlayState: OverlayState }).overlayState,
        });
      }
    } catch {
      // ignore parse errors
    }
  });
}

// BroadcastChannel: overlay receives state updates from admin in same browser
if (channel && role === 'overlay') {
  channel.onmessage = (event) => {
    try {
      const overlayState =
        typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      useGameStore.setState({ overlayState });
    } catch (err) {
      console.error('[BroadcastChannel] parse error:', err);
    }
  };
}
