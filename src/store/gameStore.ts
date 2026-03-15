import { create } from 'zustand';
import type { Question, QuestionSet, GameSession, LifelineUsage, OverlayState, LifelineType, SessionStatus } from '@/types/game';

// Mock data
const mockQuestions: Question[] = [
  {
    id: 'q1', text: 'What is the capital of France?', level: 1, category: 'Geography', setId: 's1',
    answers: [
      { id: 'a1', text: 'London', questionId: 'q1', isCorrect: false },
      { id: 'a2', text: 'Paris', questionId: 'q1', isCorrect: true },
      { id: 'a3', text: 'Berlin', questionId: 'q1', isCorrect: false },
      { id: 'a4', text: 'Madrid', questionId: 'q1', isCorrect: false },
    ],
  },
  {
    id: 'q2', text: 'Which planet is known as the Red Planet?', level: 2, category: 'Science', setId: 's1',
    answers: [
      { id: 'a5', text: 'Venus', questionId: 'q2', isCorrect: false },
      { id: 'a6', text: 'Jupiter', questionId: 'q2', isCorrect: false },
      { id: 'a7', text: 'Mars', questionId: 'q2', isCorrect: true },
      { id: 'a8', text: 'Saturn', questionId: 'q2', isCorrect: false },
    ],
  },
  {
    id: 'q3', text: 'Who painted the Mona Lisa?', level: 3, category: 'Art', setId: 's1',
    answers: [
      { id: 'a9', text: 'Van Gogh', questionId: 'q3', isCorrect: false },
      { id: 'a10', text: 'Picasso', questionId: 'q3', isCorrect: false },
      { id: 'a11', text: 'Da Vinci', questionId: 'q3', isCorrect: true },
      { id: 'a12', text: 'Rembrandt', questionId: 'q3', isCorrect: false },
    ],
  },
  {
    id: 'q4', text: 'What is the largest ocean on Earth?', level: 4, category: 'Geography', setId: 's1',
    answers: [
      { id: 'a13', text: 'Atlantic', questionId: 'q4', isCorrect: false },
      { id: 'a14', text: 'Indian', questionId: 'q4', isCorrect: false },
      { id: 'a15', text: 'Arctic', questionId: 'q4', isCorrect: false },
      { id: 'a16', text: 'Pacific', questionId: 'q4', isCorrect: true },
    ],
  },
  {
    id: 'q5', text: 'In what year did the Titanic sink?', level: 5, category: 'History', setId: 's1',
    answers: [
      { id: 'a17', text: '1905', questionId: 'q5', isCorrect: false },
      { id: 'a18', text: '1912', questionId: 'q5', isCorrect: true },
      { id: 'a19', text: '1920', questionId: 'q5', isCorrect: false },
      { id: 'a20', text: '1898', questionId: 'q5', isCorrect: false },
    ],
  },
];

const mockSet: QuestionSet = {
  id: 's1',
  name: 'General Knowledge',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  questions: mockQuestions,
};

interface GameStore {
  // Data
  questionSets: QuestionSet[];
  session: GameSession | null;
  lifelines: LifelineUsage[];
  overlayState: OverlayState;

  // Admin actions
  createSession: (setId: string) => void;
  startGame: () => void;
  nextQuestion: () => void;
  revealAnswer: () => void;
  finishGame: () => void;
  useLifeline: (type: LifelineType) => void;
  resetGame: () => void;
}

const initialOverlay: OverlayState = {
  id: 'main',
  revealAnswer: false,
  hiddenAnswerIds: [],
  gameFinished: false,
};

export const useGameStore = create<GameStore>((set, get) => ({
  questionSets: [mockSet],
  session: null,
  lifelines: [],
  overlayState: initialOverlay,

  createSession: (setId: string) => {
    const session: GameSession = {
      id: crypto.randomUUID(),
      status: 'WAITING',
      currentLevel: 0,
      revealAnswer: false,
      setId,
    };
    const lifelines: LifelineUsage[] = [
      { id: crypto.randomUUID(), type: 'FIFTY_FIFTY', used: false, sessionId: session.id },
      { id: crypto.randomUUID(), type: 'ASK_AUDIENCE', used: false, sessionId: session.id },
      { id: crypto.randomUUID(), type: 'PHONE_FRIEND', used: false, sessionId: session.id },
    ];
    set({ session, lifelines, overlayState: { ...initialOverlay, sessionId: session.id } });
  },

  startGame: () => {
    const { session } = get();
    if (!session) return;
    set({ session: { ...session, status: 'PLAYING', currentLevel: 0 } });
    get().nextQuestion();
  },

  nextQuestion: () => {
    const { session, questionSets, overlayState } = get();
    if (!session) return;
    const qSet = questionSets.find(s => s.id === session.setId);
    if (!qSet) return;
    const nextLevel = session.currentLevel + 1;
    const question = qSet.questions.find(q => q.level === nextLevel);
    if (!question) {
      set({
        session: { ...session, status: 'WON', currentLevel: nextLevel - 1 },
        overlayState: { ...overlayState, gameFinished: true, currentQuestion: undefined, revealAnswer: false },
      });
      return;
    }
    // Strip isCorrect for overlay
    const safeQuestion: Question = {
      ...question,
      answers: question.answers.map(({ isCorrect, ...a }) => a as any),
    };
    set({
      session: { ...session, currentLevel: nextLevel, currentQuestionId: question.id, revealAnswer: false },
      overlayState: {
        ...overlayState,
        currentQuestion: safeQuestion,
        revealAnswer: false,
        hiddenAnswerIds: [],
        correctAnswerId: undefined,
        gameFinished: false,
      },
    });
  },

  revealAnswer: () => {
    const { session, questionSets, overlayState } = get();
    if (!session || !session.currentQuestionId) return;
    const qSet = questionSets.find(s => s.id === session.setId);
    const question = qSet?.questions.find(q => q.id === session.currentQuestionId);
    const correctAnswer = question?.answers.find(a => a.isCorrect);
    if (!correctAnswer) return;
    set({
      session: { ...session, revealAnswer: true },
      overlayState: {
        ...overlayState,
        revealAnswer: true,
        correctAnswerId: correctAnswer.id,
      },
    });
  },

  finishGame: () => {
    const { session, overlayState } = get();
    if (!session) return;
    set({
      session: { ...session, status: 'FINISHED' },
      overlayState: { ...overlayState, gameFinished: true, currentQuestion: undefined },
    });
  },

  useLifeline: (type: LifelineType) => {
    const { lifelines, overlayState, questionSets, session } = get();
    const lifeline = lifelines.find(l => l.type === type && !l.used);
    if (!lifeline || !session) return;

    const updatedLifelines = lifelines.map(l =>
      l.id === lifeline.id ? { ...l, used: true, usedAt: new Date().toISOString() } : l
    );

    if (type === 'FIFTY_FIFTY') {
      const qSet = questionSets.find(s => s.id === session.setId);
      const question = qSet?.questions.find(q => q.id === session.currentQuestionId);
      if (question) {
        const incorrectAnswers = question.answers.filter(a => !a.isCorrect);
        const toHide = incorrectAnswers.slice(0, 2).map(a => a.id);
        set({
          lifelines: updatedLifelines,
          overlayState: { ...overlayState, hiddenAnswerIds: toHide },
        });
        return;
      }
    }
    set({ lifelines: updatedLifelines });
  },

  resetGame: () => {
    set({ session: null, lifelines: [], overlayState: initialOverlay });
  },
}));
