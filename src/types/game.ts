// ============================================================
// ゲーム型定義
// ============================================================

export type DivisionId = 1 | 2 | 3;

export type SquareType =
  | 'start'
  | 'goal'
  | 'blue'
  | 'red'
  | 'mission'
  | 'random';

export type RandomEventType =
  | 'swap'       // いれかわりマス
  | 'nominate'   // 指名マス
  | 'cooperate'  // 協力マス
  | 'vote'       // ひみつ投票マス
  | 'present'    // プレゼントマス
  | 'time'       // タイムマス
  | 'warp'       // ワープマス
  | 'card';      // カードマス

export type MinigameType = 'camera' | 'mic' | 'input';

export interface Square {
  id: number;
  type: SquareType;
  row: number;
  col: number;
  isGoal?: boolean;
}

export interface Player {
  id: number;
  name: string;
  color: string;
  emoji: string;
  avatarUrl: string; // キャラクター画像パス
  position: number; // マスのindex (0=スタート)
  points: number;
  lapsCompleted: number;
  participationCount: number;
}

export interface Challenge {
  id: number;
  text: string;
}

export interface Mission {
  id: number;
  text: string;
}

export interface Minigame {
  id: number;
  type: MinigameType;
  name: string;
  description: string;
}

export interface DivisionContent {
  divisionId: DivisionId;
  name: string;
  goal: string;
  challenges: Challenge[];
  missions: Mission[];
  minigames: Minigame[];
  redAvoidanceTasks: Challenge[];
  randomTasks: {
    cooperate: string[];
    vote: string[];
    time: string[];
    nominate: string[];
  };
}

export type GamePhase =
  | 'title'         // タイトル画面
  | 'divisionSelect'// 区分選択
  | 'playerSetup'   // プレイヤー設定
  | 'playing'       // ゲーム中
  | 'summary'       // まとめ画面
  | 'teacherGuide'; // 教師向け解説

export type EventPhase =
  | 'idle'
  | 'rolling'
  | 'moving'
  | 'animatingMove'
  | 'arrived'
  | 'blueEvent'
  | 'redEvent'
  | 'missionEvent'
  | 'randomEvent'
  | 'minigame'
  | 'goalCelebration'
  | 'bonus';

export interface TeacherNote {
  turn: number;
  playerName: string;
  text: string;
}

export interface AchievedTask {
  playerName: string;
  taskText: string;
  turn: number;
}

export interface GameState {
  phase: GamePhase;
  eventPhase: EventPhase;
  divisionId: DivisionId | null;
  players: Player[];
  currentPlayerIndex: number;
  squares: Square[];
  turn: number;
  lastDiceValue: number | null;
  currentEvent: {
    type: SquareType | null;
    content: Challenge | Mission | Minigame | null;
    randomEventType?: RandomEventType;
  };
  assistMode: boolean;
  teacherNotes: TeacherNote[];
  achievedTasks: AchievedTask[];
  capturedPhotos: string[];
  pendingMinigame: Minigame | null;
  teamPoints: number;
  showTeamAward: boolean;
  lastTeamAwardAt: number;
}
