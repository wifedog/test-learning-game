
export interface GameHistory {
  level: number;
  score: number;
  accuracy: number;
  timestamp: number;
}

export interface Question {
  id: string;
  a: number;
  b: number;
  answer: number;
  options: number[];
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
}

export interface Target {
  id: number;
  value: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  isCorrect: boolean;
  destroyed: boolean;
  hitFlash: number;
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  GAME_OVER = 'GAME_OVER',
  HISTORY = 'HISTORY'
}
