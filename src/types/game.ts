export interface Answer {
  id: string;
  text: string;
  isCorrect?: boolean; // only available after reveal
  questionId: string;
}

export interface Question {
  id: string;
  text: string;
  level: number;
  category: string;
  setId: string;
  answers: Answer[];
}

export interface QuestionSet {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
}

export type SessionStatus = 'WAITING' | 'PLAYING' | 'WON' | 'LOST' | 'FINISHED';
export type LifelineType = 'FIFTY_FIFTY' | 'ASK_AUDIENCE' | 'PHONE_FRIEND';

export interface LifelineUsage {
  id: string;
  type: LifelineType;
  used: boolean;
  usedAt?: string;
  sessionId: string;
}

export interface GameSession {
  id: string;
  status: SessionStatus;
  currentLevel: number;
  currentQuestionId?: string;
  revealAnswer: boolean;
  setId: string;
}

export interface OverlayState {
  id: string;
  sessionId?: string;
  currentQuestion?: Question;
  revealAnswer: boolean;
  hiddenAnswerIds: string[];
  correctAnswerId?: string;
  gameFinished: boolean;
  finalLevel?: number;
  gameStatus?: SessionStatus;
}

export const LEVEL_AMOUNTS: Record<number, string> = {
  1: '$100',
  2: '$200',
  3: '$300',
  4: '$500',
  5: '$1,000',
  6: '$2,000',
  7: '$4,000',
  8: '$8,000',
  9: '$16,000',
  10: '$32,000',
  11: '$64,000',
  12: '$125,000',
  13: '$250,000',
  14: '$500,000',
  15: '$1,000,000',
};

export const MILESTONE_LEVELS = [5, 10, 15];

export const ANSWER_LABELS = ['A', 'B', 'C', 'D'];
