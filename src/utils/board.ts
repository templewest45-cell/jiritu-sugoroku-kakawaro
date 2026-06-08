import type { Square, SquareType } from '../types/game';

export const SQUARE_COLORS: Record<string, string> = {
  start:   '#86efac',
  goal:    '#fde047',
  blue:    '#93c5fd',
  red:     '#fca5a5',
  mission: '#fdba74',
  random:  '#d8b4fe',
};

export const SQUARE_NAMES: Record<string, string> = {
  start:   'スタート',
  goal:    'ゴール',
  blue:    'せいこう',
  red:     'マイナス',
  mission: 'みんなで',
  random:  'なにかな',
};

export const SQUARE_ICONS: Record<string, string> = {
  start:   '🚩',
  goal:    '👑',
  blue:    '⭐',
  red:     '✖',
  mission: '🤝',
  random:  '❓',
};

// 30マス（スタート + 28マス + ゴール）の蛇行型ボード
// 1行あたり6マス × 5行
const COLS = 6;
const TOTAL_SQUARES = 30;

// 区分ごとのマス内訳（合計28マス、スタート/ゴール除く）
type SquareLayout = { blue: number; red: number; mission: number; random: number };

const divisionLayouts: Record<number, SquareLayout> = {
  1: { blue: 14, red: 5, mission: 5, random: 4 },
  2: { blue: 13, red: 5, mission: 6, random: 4 },
  3: { blue: 12, red: 5, mission: 6, random: 5 },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateSquares(divisionId: number): Square[] {
  const layout = divisionLayouts[divisionId] ?? divisionLayouts[1];

  // 中間マスを構築（スタートとゴール以外の28マス）
  const middleTypes: SquareType[] = [
    ...Array(layout.blue).fill('blue'),
    ...Array(layout.red).fill('red'),
    ...Array(layout.mission).fill('mission'),
    ...Array(layout.random).fill('random'),
  ];
  const shuffled = shuffle(middleTypes);

  // 全マスリスト
  const allTypes: SquareType[] = ['start', ...shuffled, 'goal'];

  // row/col を蛇行型で割り当て
  const squares: Square[] = allTypes.map((type, idx) => {
    const rowFromBottom = Math.floor(idx / COLS);
    const colInRow = idx % COLS;
    // 偶数行は左→右、奇数行は右→左
    const col = rowFromBottom % 2 === 0 ? colInRow : COLS - 1 - colInRow;
    const row = rowFromBottom;
    return { id: idx, type, row, col };
  });

  return squares;
}

export const TOTAL_SQUARES_COUNT = TOTAL_SQUARES;
