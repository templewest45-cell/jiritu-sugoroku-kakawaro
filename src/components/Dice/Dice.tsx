import { useEffect, useState } from 'react';
import './Dice.css';
import type { GameAction } from '../../store/gameStore';

interface Props {
  dispatch: React.Dispatch<GameAction>;
  isRolling: boolean;
  lastValue: number | null;
  disabled: boolean;
}

const FACE_DOTS = [
  // 1
  [[50, 50]],
  // 2
  [[25, 25], [75, 75]],
  // 3
  [[25, 25], [50, 50], [75, 75]],
  // 4
  [[25, 25], [75, 25], [25, 75], [75, 75]],
  // 5
  [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  // 6
  [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
];

function DiceSvg({ face, rolling }: { face: number; rolling: boolean }) {
  const dots = FACE_DOTS[face] ?? FACE_DOTS[0];
  return (
    <svg
      viewBox="0 0 100 100"
      className={`dice-svg ${rolling ? 'rolling' : ''}`}
    >
      <rect
        x="4" y="4" width="92" height="92" rx="16"
        fill={rolling ? '#fbbf24' : '#fff'}
        stroke={rolling ? '#f59e0b' : '#d1d5db'}
        strokeWidth="3"
      />
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="8"
          fill={rolling ? '#78350f' : '#1e1b4b'}
        />
      ))}
    </svg>
  );
}

export function Dice({ dispatch, isRolling, lastValue, disabled }: Props) {
  const [displayFace, setDisplayFace] = useState(0);

  useEffect(() => {
    if (!isRolling) return;
    let count = 0;
    const interval = setInterval(() => {
      setDisplayFace(Math.floor(Math.random() * 6));
      count++;
      if (count >= 20) {
        clearInterval(interval);
        const value = Math.floor(Math.random() * 6) + 1;
        setDisplayFace(value - 1);
        dispatch({ type: 'DICE_RESULT', value });
      }
    }, 70);
    return () => clearInterval(interval);
  }, [isRolling, dispatch]);

  const handleRoll = () => {
    if (disabled || isRolling) return;
    dispatch({ type: 'ROLL_DICE' });
  };

  return (
    <div className="dice-panel">
      {/* サイコロ本体 */}
      <div
        className={`dice-body ${isRolling ? 'dice-body--rolling' : ''} ${lastValue !== null && !isRolling ? 'dice-body--landed' : ''} ${disabled && !isRolling ? 'dice-body--disabled' : ''}`}
        onClick={handleRoll}
        role="button"
        tabIndex={disabled || isRolling ? -1 : 0}
        aria-label="サイコロを振る"
      >
        <DiceSvg face={displayFace} rolling={isRolling} />
      </div>

      {/* 出目表示 */}
      {lastValue !== null && !isRolling ? (
        <div className="dice-result">
          <span className="dice-result__num">{lastValue}</span>
          <span className="dice-result__label">が出た！</span>
        </div>
      ) : (
        <div className="dice-hint">
          {isRolling ? '🎲 ころころ...' : disabled ? '⏳ 待機中' : '🎲 タップして振る！'}
        </div>
      )}
    </div>
  );
}
