import { useState } from 'react';
import './PlayerSetup.css';
import type { GameAction } from '../../store/gameStore';
import { PLAYER_AVATARS, PLAYER_AVATAR_LABELS } from '../../store/gameStore';
import type { DivisionId } from '../../types/game';

interface Props {
  dispatch: React.Dispatch<GameAction>;
  divisionId: DivisionId;
}

const DEFAULT_NAMES = ['Aさん', 'Bさん', 'Cさん', 'Dさん'];
const PLAYER_COLORS = ['#EF4444', '#3B82F6', '#22C55E', '#F59E0B'];
const PLAYER_COLOR_NAMES = ['レッド', 'ブルー', 'グリーン', 'イエロー'];

export function PlayerSetup({ dispatch, divisionId }: Props) {
  const [count, setCount] = useState(2);
  const [names, setNames] = useState(DEFAULT_NAMES.slice());
  // 各プレイヤーが選択中のアバターindex
  const [avatarIndices, setAvatarIndices] = useState([0, 1, 2, 3]);

  const setAvatarForPlayer = (playerIdx: number, avatarIdx: number) => {
    setAvatarIndices(prev => {
      const next = [...prev];
      next[playerIdx] = avatarIdx;
      return next;
    });
  };

  const handleStart = () => {
    dispatch({
      type: 'SET_PLAYERS',
      players: names.slice(0, count).map((n, i) => ({
        name: n || `プレイヤー${i + 1}`,
        avatarIndex: avatarIndices[i],
      })),
    });
    dispatch({ type: 'START_GAME' });
  };

  return (
    <div className="player-setup">
      <div className="player-setup__header">
        <div className="player-setup__div-badge">区分 {divisionId}</div>
        <h2 className="player-setup__title">プレイヤー設定</h2>
        <p className="player-setup__sub">人数・なまえ・キャラクターをえらんでね</p>
      </div>

      {/* 人数選択 */}
      <div className="player-setup__count-selector">
        <p className="player-setup__count-label">プレイ人数</p>
        <div className="player-setup__count-btns">
          {[1, 2, 3, 4].map(n => (
            <button
              key={n}
              className={`player-setup__count-btn ${count === n ? 'active' : ''}`}
              onClick={() => setCount(n)}
            >
              {n}名
            </button>
          ))}
        </div>
      </div>

      {/* プレイヤー設定リスト */}
      <div className="player-setup__players">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="player-setup__player-card" style={{ '--p-color': PLAYER_COLORS[i] } as React.CSSProperties}>
            {/* カードヘッダー */}
            <div className="player-setup__card-header">
              <span className="player-setup__color-badge" style={{ background: PLAYER_COLORS[i] }}>
                P{i + 1} · {PLAYER_COLOR_NAMES[i]}
              </span>
              <input
                className="player-setup__player-input"
                type="text"
                placeholder={DEFAULT_NAMES[i]}
                value={names[i]}
                onChange={e => {
                  const n = [...names];
                  n[i] = e.target.value;
                  setNames(n);
                }}
                maxLength={10}
              />
            </div>

            {/* キャラクター選択グリッド */}
            <div className="player-setup__avatar-grid">
              {PLAYER_AVATARS.map((url, ai) => (
                <button
                  key={ai}
                  className={`player-setup__avatar-btn ${avatarIndices[i] === ai ? 'selected' : ''}`}
                  onClick={() => setAvatarForPlayer(i, ai)}
                  title={PLAYER_AVATAR_LABELS[ai]}
                >
                  {url.startsWith('/') ? (
                    <img
                      src={url}
                      alt={PLAYER_AVATAR_LABELS[ai]}
                      className="player-setup__avatar-img"
                    />
                  ) : (
                    <div className="player-setup__avatar-emoji">
                      {url}
                    </div>
                  )}
                  <span className="player-setup__avatar-label">{PLAYER_AVATAR_LABELS[ai]}</span>
                  {avatarIndices[i] === ai && (
                    <div className="player-setup__avatar-check">✓</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="player-setup__actions">
        <button
          className="btn btn-ghost btn-lg"
          onClick={() => dispatch({ type: 'GO_TO_DIVISION_SELECT' })}
        >
          ← 戻る
        </button>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleStart}
        >
          🎲 ゲームスタート！
        </button>
      </div>
    </div>
  );
}
