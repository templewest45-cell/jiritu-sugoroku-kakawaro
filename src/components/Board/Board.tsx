import { useEffect, useRef, useMemo } from 'react';
import './Board.css';
import type { GameState } from '../../types/game';
import type { GameAction } from '../../store/gameStore';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

import { SQUARE_COLORS, SQUARE_NAMES, SQUARE_ICONS } from '../../utils/board';

// 凡例
const LEGEND_ITEMS = [
  { type: 'blue',    label: `${SQUARE_ICONS.blue} ${SQUARE_NAMES.blue}`,    desc: 'できたら+10pt' },
  { type: 'red',     label: `${SQUARE_ICONS.red} ${SQUARE_NAMES.red}`,      desc: 'チャレンジ-5pt' },
  { type: 'mission', label: `${SQUARE_ICONS.mission} ${SQUARE_NAMES.mission}`, desc: '全員で+15pt' },
  { type: 'random',  label: `${SQUARE_ICONS.random} ${SQUARE_NAMES.random}`,  desc: 'ランダムイベント' },
  { type: 'goal',    label: `${SQUARE_ICONS.goal} ${SQUARE_NAMES.goal}`,      desc: '到達で+20pt' },
];

export function Board({ state }: Props) {
  const { squares, players, currentPlayerIndex, eventPhase } = state;
  const activePlayerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);

  // マスの座標と道のSVGパスを計算（横に長いうねうね道）
  const { positions, boardWidth, pathD } = useMemo(() => {
    const STEP_X = 220; // マスとマスの間隔
    
    const pos = squares.map((_, i) => {
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

  // マスタップでの移動ショートカット機能はアニメーション追加のため削除しました。

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

              {/* プレイヤーコマ（以前ここにあった部分は外に出す） */}

              {isMoving && (
                <div className="board-square__move-overlay">タップ！</div>
              )}
            </div>
          );
        })}

        {/* プレイヤーコマ群（絶対配置で滑らかに移動させる） */}
        {players.map(p => {
          const { x, y } = positions[p.position];
          const playersHere = playersBySquare[p.position] ?? [];
          const pIndex = playersHere.findIndex(ph => ph.id === p.id);
          const totalHere = playersHere.length;
          const offsetX = totalHere > 1 ? (pIndex - (totalHere - 1) / 2) * 20 : 0;
          const isActive = p.id === players[currentPlayerIndex].id;

          return (
            <div
              key={p.id}
              className={`board-piece-absolute ${isActive ? 'board-piece-absolute--active' : ''}`}
              style={{
                '--p-color': p.color,
                left: `${x + offsetX}px`,
                top: `${y}px`,
                zIndex: isActive ? 1000 : 100 + p.position,
              } as React.CSSProperties}
              title={p.name}
            >
              <img src={p.avatarUrl} alt={p.name} className="board-piece__img" />
              {isActive && <div className="board-piece__arrow">▼</div>}
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
