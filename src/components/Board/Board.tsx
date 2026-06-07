import { useEffect, useRef, useMemo } from 'react';
import './Board.css';
import type { GameState } from '../../types/game';
import type { GameAction } from '../../store/gameStore';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

// マスの色（さらに温かみのある鮮やかな絵本カラーへ）
const SQUARE_COLORS: Record<string, string> = {
  start:   '#86efac', // フレッシュグリーン
  goal:    '#fde047', // ゴールドイエロー
  blue:    '#93c5fd', // スカイブルー
  red:     '#fca5a5', // コーラルピンク
  mission: '#fdba74', // マンダリンオレンジ
  random:  '#d8b4fe', // マジカルパープル
};

const SQUARE_NAMES: Record<string, string> = {
  start:   'スタート',
  goal:    'ゴール',
  blue:    'せいこう',
  red:     'マイナス',
  mission: 'みんなで',
  random:  'なにかな',
};

const SQUARE_ICONS: Record<string, string> = {
  start:   '🚩',
  goal:    '👑',
  blue:    '⭐',
  red:     '✖',
  mission: '🤝',
  random:  '❓',
};

// 凡例
const LEGEND_ITEMS = [
  { type: 'blue',    label: '⭐ せいこう',    desc: 'できたら+10pt' },
  { type: 'red',     label: '✖ マイナス',    desc: 'チャレンジ-5pt' },
  { type: 'mission', label: '🤝 みんなで',    desc: '全員で+15pt' },
  { type: 'random',  label: '❓ なにかな',    desc: 'ランダムイベント' },
  { type: 'goal',    label: '👑 ゴール',      desc: '到達で+20pt' },
];

export function Board({ state, dispatch }: Props) {
  const { squares, players, currentPlayerIndex, eventPhase } = state;
  const activePlayerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);

  // マスの座標と道のSVGパスを計算（横に長いうねうね道）
  const { positions, boardWidth, pathD } = useMemo(() => {
    const STEP_X = 220; // マスとマスの間隔
    
    const pos = squares.map((sq, i) => {
      const x = 200 + i * STEP_X;
      // yはサインカーブでうねらせる
      const angle = i * 0.45;
      const y = 350 + Math.sin(angle) * 160 + Math.cos(i * 1.2) * 40;
      // 少しランダムに傾ける
      const rotate = Math.sin(i * 3.1) * 12; 
      return { x, y, rotate };
    });

    const width = pos[pos.length - 1].x + 400;

    // 滑らかなベジェ曲線でパスを描画
    let d = `M ${pos[0].x} ${pos[0].y} `;
    for (let i = 0; i < pos.length - 1; i++) {
      const p1 = pos[i];
      const p2 = pos[i + 1];
      const cx = (p1.x + p2.x) / 2;
      d += `C ${cx} ${p1.y}, ${cx} ${p2.y}, ${p2.x} ${p2.y} `;
    }

    return { positions: pos, boardWidth: width, pathD: d };
  }, [squares]);

  // プレイヤー移動に合わせてボードを自動スクロール
  useEffect(() => {
    if (activePlayerRef.current && scrollWrapperRef.current) {
      const wrapper = scrollWrapperRef.current;
      const target = activePlayerRef.current;
      const targetRect = target.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      
      const scrollLeft = wrapper.scrollLeft + (targetRect.left - wrapperRect.left) - wrapperRect.width / 2 + targetRect.width / 2;
      
      wrapper.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  }, [players[currentPlayerIndex]?.position]);

  // 各マスにいるプレイヤーを集計
  const playersBySquare: Record<number, typeof players> = {};
  players.forEach(p => {
    if (!playersBySquare[p.position]) playersBySquare[p.position] = [];
    playersBySquare[p.position].push(p);
  });

  const handleMoveComplete = () => {
    if (eventPhase === 'moving') {
      dispatch({ type: 'MOVE_COMPLETE' });
    }
  };

  return (
    <div className="board-scroll-wrapper" ref={scrollWrapperRef}>
      <div className="board-world" style={{ width: `${boardWidth}px` }}>
        
        {/* 背景装飾（雲や山） */}
        <div className="board-bg-clouds"></div>
        <div className="board-bg-mountains"></div>
        <div className="board-bg-ground"></div>

        {/* 道の線 */}
        <svg className="board-path-svg" width={boardWidth} height="700">
          <path d={pathD} className="board-path-line" />
        </svg>

        {/* マス群 */}
        {squares.map((sq, i) => {
          const { x, y, rotate } = positions[i];
          const isCurrentPos = players[currentPlayerIndex]?.position === sq.id;
          const playersHere = playersBySquare[sq.id] ?? [];
          const isMoving = eventPhase === 'moving' && isCurrentPos;

          return (
            <div
              key={sq.id}
              className={`board-square board-square--${sq.type} ${isCurrentPos ? 'current' : ''} ${isMoving ? 'moving' : ''}`}
              style={{ 
                '--sq-color': SQUARE_COLORS[sq.type],
                left: `${x}px`,
                top: `${y}px`,
                transform: `translate(-50%, -50%) rotate(${rotate}deg)`
              } as React.CSSProperties}
              ref={isCurrentPos ? activePlayerRef : null}
              onClick={isMoving ? handleMoveComplete : undefined}
            >
              {/* 装飾のピン/草など */}
              <div className="board-square__deco"></div>

              {/* マス番号 */}
              <div className="board-square__num-tag">{sq.id}</div>

              {/* アイコンとテキスト */}
              <div className="board-square__content">
                <span className="board-square__icon">{SQUARE_ICONS[sq.type]}</span>
                <span className="board-square__name">{SQUARE_NAMES[sq.type]}</span>
              </div>

              {/* プレイヤーコマ（マスの上に大きく立たせる） */}
              {playersHere.length > 0 && (
                <div className="board-square__pieces" style={{ transform: `rotate(${-rotate}deg)` }}>
                  {playersHere.map(p => (
                    <div
                      key={p.id}
                      className={`board-piece ${p.id === players[currentPlayerIndex].id ? 'board-piece--active' : ''}`}
                      style={{ '--p-color': p.color } as React.CSSProperties}
                      title={p.name}
                    >
                      <img src={p.avatarUrl} alt={p.name} className="board-piece__img" />
                      {/* アクティブプレイヤーには矢印マーク */}
                      {p.id === players[currentPlayerIndex].id && <div className="board-piece__arrow">▼</div>}
                    </div>
                  ))}
                </div>
              )}

              {isMoving && (
                <div className="board-square__move-overlay">タップ！</div>
              )}
            </div>
          );
        })}
      </div>

      {/* 凡例バー（左下に固定浮遊） */}
      <div className="board-legend-floating">
        {LEGEND_ITEMS.map(item => (
          <div key={item.type} className="board-legend__item" style={{ '--sq-color': SQUARE_COLORS[item.type] } as React.CSSProperties}>
            <div className="board-legend__dot" />
            <div className="board-legend__text">
              <span className="board-legend__label">{item.label}</span>
              <span className="board-legend__desc">{item.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
