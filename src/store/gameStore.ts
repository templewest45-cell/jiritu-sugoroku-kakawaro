import type {
  GameState,
  GamePhase,
  EventPhase,
  Player,
  DivisionId,
  AchievedTask,
  TeacherNote,
  Challenge,
  Mission,
  Minigame,
  RandomEventType,
  SquareType,
} from '../types/game';
import { generateSquares, TOTAL_SQUARES_COUNT } from '../utils/board';
import { content1 } from '../data/content-1';
import { content2 } from '../data/content-2';
import { content3 } from '../data/content-3';

const PLAYER_COLORS = ['#EF4444', '#3B82F6', '#22C55E', '#F59E0B'];
const PLAYER_EMOJIS = ['🔴', '🔵', '🟢', '🟡'];
export const PLAYER_AVATARS = [
  '/characters/player1_boyA.png',
  '/characters/player2_boyB.png',
  '/characters/player3_girlA.png',
  '/characters/player4_girlB.png',
  '/characters/teacher_m.png',
  '/characters/teacher_f.png',
  '/characters/okojo.png',
];
export const PLAYER_AVATAR_LABELS = [
  '男の子A', '男の子B', '女の子A', '女の子B', 
  '先生(男)', '先生(女)', 'オコジョ'
];

export const POINTS = {
  blue: 10,
  red: -5,
  mission: 15,
  goal: 20,
  bonus: 5,
} as const;

const RANDOM_EVENTS: RandomEventType[] = [
  'swap', 'nominate', 'cooperate', 'vote', 'present', 'time', 'warp', 'card',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getContent(divisionId: DivisionId) {
  if (divisionId === 1) return content1;
  if (divisionId === 2) return content2;
  return content3;
}

export const initialState: GameState = {
  phase: 'title',
  eventPhase: 'idle',
  divisionId: null,
  players: [],
  currentPlayerIndex: 0,
  squares: [],
  turn: 0,
  lastDiceValue: null,
  currentEvent: { type: null, content: null },
  assistMode: false,
  teacherNotes: [],
  achievedTasks: [],
  capturedPhotos: [],
  pendingMinigame: null,
  teamPoints: 0,
  showTeamAward: false,
  lastTeamAwardAt: 0,
};

export type GameAction =
  | { type: 'GO_TO_TITLE' }
  | { type: 'GO_TO_DIVISION_SELECT' }
  | { type: 'GO_TO_TEACHER_GUIDE' }
  | { type: 'SELECT_DIVISION'; divisionId: DivisionId }
  | { type: 'SET_PLAYERS'; players: { name: string; avatarIndex: number }[] }
  | { type: 'START_GAME' }
  | { type: 'ROLL_DICE' }
  | { type: 'DICE_RESULT'; value: number }
  | { type: 'MOVE_COMPLETE' }
  | { type: 'BLUE_SUCCESS' }
  | { type: 'BLUE_SKIP' }
  | { type: 'RED_AVOID' }
  | { type: 'RED_TAKE' }
  | { type: 'MISSION_CLEAR' }
  | { type: 'MISSION_FAIL' }
  | { type: 'RANDOM_EVENT_DONE'; payload?: { targetPlayerIndex?: number; giftPoints?: number } }
  | { type: 'BONUS_POINT'; playerIndex: number }
  | { type: 'MINIGAME_DONE'; payload?: { playerIndex: number; points: number }[] }
  | { type: 'GOAL_DONE' }
  | { type: 'ADD_TEACHER_NOTE'; note: Omit<TeacherNote, 'turn'> }
  | { type: 'ADD_PHOTO'; dataUrl: string }
  | { type: 'TOGGLE_ASSIST_MODE' }
  | { type: 'END_SESSION' }
  | { type: 'DISMISS_TEAM_AWARD' };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'GO_TO_TITLE':
      return { ...initialState, phase: 'title' };

    case 'GO_TO_DIVISION_SELECT':
      return { ...state, phase: 'divisionSelect' };

    case 'GO_TO_TEACHER_GUIDE':
      return { ...state, phase: 'teacherGuide' };

    case 'SELECT_DIVISION':
      return { ...state, divisionId: action.divisionId, phase: 'playerSetup' };

    case 'SET_PLAYERS': {
      const players: Player[] = action.players.map((p, i) => ({
        id: i,
        name: p.name,
        color: PLAYER_COLORS[i],
        emoji: PLAYER_EMOJIS[i],
        avatarUrl: PLAYER_AVATARS[p.avatarIndex ?? i],
        position: 0,
        points: 0,
        lapsCompleted: 0,
        participationCount: 0,
      }));
      return { ...state, players };
    }

    case 'START_GAME': {
      const squares = generateSquares(state.divisionId!);
      return { ...state, phase: 'playing', squares, turn: 1, eventPhase: 'idle' };
    }

    case 'ROLL_DICE':
      return { ...state, eventPhase: 'rolling' };

    case 'DICE_RESULT':
      return { ...state, lastDiceValue: action.value, eventPhase: 'moving' };

    case 'MOVE_COMPLETE': {
      const player = state.players[state.currentPlayerIndex];
      const newPos = Math.min(player.position + (state.lastDiceValue ?? 0), TOTAL_SQUARES_COUNT - 1);
      const square = state.squares[newPos];
      const content = state.divisionId ? getContent(state.divisionId) : content1;

      let currentEvent: GameState['currentEvent'] = { type: null, content: null };
      let eventPhase: EventPhase = 'idle';

      const updatedPlayers = state.players.map((p, i) =>
        i === state.currentPlayerIndex ? { ...p, position: newPos, participationCount: p.participationCount + 1 } : p
      );

      switch (square.type) {
        case 'blue': {
          const challenge: Challenge = pickRandom(content.challenges);
          currentEvent = { type: 'blue', content: challenge };
          eventPhase = 'blueEvent';
          break;
        }
        case 'red': {
          const avoidanceTask = pickRandom(content.redAvoidanceTasks);
          currentEvent = { type: 'red', content: avoidanceTask };
          eventPhase = 'redEvent';
          break;
        }
        case 'mission': {
          const mission: Mission = pickRandom(content.missions);
          currentEvent = { type: 'mission', content: mission };
          eventPhase = 'missionEvent';
          break;
        }
        case 'random': {
          const randomEventType: RandomEventType = pickRandom(RANDOM_EVENTS);
          let randomTaskText = null;
          if (['cooperate', 'vote', 'time', 'nominate'].includes(randomEventType)) {
            randomTaskText = pickRandom(content.randomTasks[randomEventType as keyof typeof content.randomTasks]);
          }
          currentEvent = { type: 'random', content: randomTaskText ? { id: 0, text: randomTaskText } : null, randomEventType };
          eventPhase = 'randomEvent';
          break;
        }
        case 'goal': {
          currentEvent = { type: 'goal', content: null };
          eventPhase = 'goalCelebration';
          break;
        }
        default:
          eventPhase = 'idle';
      }

      return {
        ...state,
        players: updatedPlayers,
        currentEvent,
        eventPhase,
      };
    }

    case 'BLUE_SUCCESS': {
      const players = state.players.map((p, i) =>
        i === state.currentPlayerIndex
          ? { ...p, points: p.points + POINTS.blue }
          : p
      );
      const achievedTasks: AchievedTask[] = [
        ...state.achievedTasks,
        {
          playerName: state.players[state.currentPlayerIndex].name,
          taskText: (state.currentEvent.content as Challenge)?.text ?? '',
          turn: state.turn,
        },
      ];
      const teamPoints = state.teamPoints + POINTS.blue;
      const { showTeamAward, lastTeamAwardAt } = checkTeamAward(teamPoints, state.lastTeamAwardAt);
      return nextTurn({ ...state, players, achievedTasks, teamPoints, showTeamAward, lastTeamAwardAt });
    }

    case 'BLUE_SKIP':
      return nextTurn(state);

    case 'RED_AVOID':
      return nextTurn(state);

    case 'RED_TAKE': {
      const players = state.players.map((p, i) =>
        i === state.currentPlayerIndex
          ? { ...p, points: Math.max(0, p.points + POINTS.red) }
          : p
      );
      return nextTurn({ ...state, players });
    }

    case 'MISSION_CLEAR': {
      const players = state.players.map((p, i) =>
        i === state.currentPlayerIndex
          ? { ...p, points: p.points + POINTS.mission }
          : p
      );
      const achievedTasks: AchievedTask[] = [
        ...state.achievedTasks,
        {
          playerName: state.players[state.currentPlayerIndex].name,
          taskText: (state.currentEvent.content as Mission)?.text ?? '',
          turn: state.turn,
        },
      ];
      const teamPoints = state.teamPoints + POINTS.mission;
      const { showTeamAward, lastTeamAwardAt } = checkTeamAward(teamPoints, state.lastTeamAwardAt);
      return nextTurn({ ...state, players, achievedTasks, teamPoints, showTeamAward, lastTeamAwardAt });
    }

    case 'MISSION_FAIL':
      return nextTurn(state);

    case 'RANDOM_EVENT_DONE': {
      const payload = action.payload;
      let players = [...state.players];

      if (state.currentEvent.randomEventType === 'swap' && payload?.targetPlayerIndex !== undefined) {
        const a = state.currentPlayerIndex;
        const b = payload.targetPlayerIndex;
        const tmpPts = players[a].points;
        players = players.map((p, i) => {
          if (i === a) return { ...p, points: players[b].points };
          if (i === b) return { ...p, points: tmpPts };
          return p;
        });
      }

      if (state.currentEvent.randomEventType === 'present' && payload?.targetPlayerIndex !== undefined) {
        const a = state.currentPlayerIndex;
        const b = payload.targetPlayerIndex;
        players = players.map((p, i) => {
          if (i === a) return { ...p, points: Math.max(0, p.points - 5) };
          if (i === b) return { ...p, points: p.points + 5 };
          return p;
        });
      }

      // 協力課題などの成功報酬 (全員に加算)
      if (payload?.giftPoints) {
        players = players.map(p => ({ ...p, points: p.points + payload.giftPoints! }));
      }

      if (state.currentEvent.randomEventType === 'warp') {
        const newPos = Math.floor(Math.random() * (TOTAL_SQUARES_COUNT - 2)) + 1;
        players = players.map((p, i) =>
          i === state.currentPlayerIndex ? { ...p, position: newPos } : p
        );
      }

      const achievedTasks = [...state.achievedTasks];
      if (state.currentEvent.content && 'text' in state.currentEvent.content) {
        achievedTasks.push({
          playerName: state.players[state.currentPlayerIndex].name,
          taskText: `【ランダムマス】${state.currentEvent.content.text}`,
          turn: state.turn,
        });
      }

      return nextTurn({ ...state, players, achievedTasks });
    }

    case 'BONUS_POINT': {
      const players = state.players.map((p, i) =>
        i === action.playerIndex ? { ...p, points: p.points + POINTS.bonus } : p
      );
      const teamPoints = state.teamPoints + POINTS.bonus;
      const { showTeamAward, lastTeamAwardAt } = checkTeamAward(teamPoints, state.lastTeamAwardAt);
      return { ...state, players, teamPoints, showTeamAward, lastTeamAwardAt };
    }

    case 'MINIGAME_DONE': {
      let nextPlayers = [...state.players];
      let teamPoints = state.teamPoints;
      
      if (action.payload) {
        action.payload.forEach(reward => {
          nextPlayers[reward.playerIndex].points += reward.points;
          teamPoints += reward.points;
        });
      }
      
      const { showTeamAward, lastTeamAwardAt } = checkTeamAward(teamPoints, state.lastTeamAwardAt);

      const achievedTasks = [...state.achievedTasks];
      if (state.pendingMinigame) {
        achievedTasks.push({
          playerName: '全員',
          taskText: `【ミニゲーム】${state.pendingMinigame.name}`,
          turn: state.turn,
        });
      }

      return { 
        ...state, 
        players: nextPlayers,
        teamPoints,
        achievedTasks,
        showTeamAward,
        lastTeamAwardAt,
        pendingMinigame: null, 
        eventPhase: 'idle' 
      };
    }

    case 'GOAL_DONE':
      return nextTurn(state);

    case 'ADD_TEACHER_NOTE':
      return {
        ...state,
        teacherNotes: [...state.teacherNotes, { ...action.note, turn: state.turn }],
      };

    case 'ADD_PHOTO':
      return { ...state, capturedPhotos: [...state.capturedPhotos, action.dataUrl] };

    case 'TOGGLE_ASSIST_MODE':
      return { ...state, assistMode: !state.assistMode };

    case 'END_SESSION':
      return { ...state, phase: 'summary' };

    case 'DISMISS_TEAM_AWARD':
      return { ...state, showTeamAward: false };

    default:
      return state;
  }
}

function checkTeamAward(teamPoints: number, lastAwardAt: number) {
  const milestone = 100;
  if (Math.floor(teamPoints / milestone) > Math.floor(lastAwardAt / milestone)) {
    return { showTeamAward: true, lastTeamAwardAt: teamPoints };
  }
  return { showTeamAward: false, lastTeamAwardAt: lastAwardAt };
}

function nextTurn(state: GameState): GameState {
  const content = state.divisionId ? getContent(state.divisionId) : content1;
  const currentPlayer = state.players[state.currentPlayerIndex];

  // ゴール到達チェック
  let players = [...state.players];
  let pendingMinigame: Minigame | null = state.pendingMinigame;

  if (currentPlayer.position >= TOTAL_SQUARES_COUNT - 1) {
    // ゴール到達 → +20pt (位置はそのまま)
    players = players.map((p, i) =>
      i === state.currentPlayerIndex
        ? { ...p, points: p.points + POINTS.goal, position: TOTAL_SQUARES_COUNT - 1 }
        : p
    );
  }

  // 仕様に基づき、全員が1回ずつ行動した「ラウンドの終わり」にミニゲームを発動
  if (state.currentPlayerIndex === state.players.length - 1) {
    pendingMinigame = pickRandom(content.minigames);
  } else {
    pendingMinigame = null;
  }

  // 全員がゴールしたかチェック
  const allFinished = players.every(p => p.position >= TOTAL_SQUARES_COUNT - 1);

  if (allFinished) {
    // 全員ゴールしたらサマリー画面へ
    return { ...state, players, phase: 'summary', eventPhase: 'idle' };
  }

  // 次のプレイヤーを探す（ゴール済みの人はスキップ）
  let nextIndex = (state.currentPlayerIndex + 1) % players.length;
  while (players[nextIndex].position >= TOTAL_SQUARES_COUNT - 1) {
    nextIndex = (nextIndex + 1) % players.length;
  }

  const teamPoints = state.teamPoints + (currentPlayer.position >= TOTAL_SQUARES_COUNT - 1 ? POINTS.goal : 0);
  const { showTeamAward, lastTeamAwardAt } = checkTeamAward(teamPoints, state.lastTeamAwardAt);

  const eventPhase: EventPhase = pendingMinigame ? 'minigame' : 'idle';

  return {
    ...state,
    players,
    currentPlayerIndex: nextIndex,
    turn: state.turn + 1,
    currentEvent: { type: null, content: null },
    eventPhase,
    pendingMinigame,
    lastDiceValue: null,
    teamPoints,
    showTeamAward,
    lastTeamAwardAt,
  };
}
