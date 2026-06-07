import './ScoreBoard.css';
import type { Player } from '../../types/game';
import type { GameAction } from '../../store/gameStore';

interface Props {
  players: Player[];
  currentPlayerIndex: number;
  teamPoints: number;
  assistMode: boolean;
  dispatch: React.Dispatch<GameAction>;
  onEndSession: () => void;
}

export function ScoreBoard({ players, currentPlayerIndex, teamPoints, assistMode, dispatch, onEndSession }: Props) {
  return (
    <div className="scoreboard">
      {/* チーム合計 */}
      <div className="scoreboard__team">
        <div className="scoreboard__team-label">チーム合計</div>
        <div className="scoreboard__team-pts">{teamPoints}<span>pt</span></div>
      </div>

      {/* プレイヤー一覧 */}
      <div className="scoreboard__players">
        {players.map((p, i) => (
          <div
            key={p.id}
            className={`scoreboard__player ${i === currentPlayerIndex ? 'active' : ''}`}
            style={{ '--p-color': p.color } as React.CSSProperties}
          >
            {/* キャラクターアバター */}
            <div className="scoreboard__avatar-wrap">
              <img
                src={p.avatarUrl}
                alt={p.name}
                className="scoreboard__avatar-img"
              />
              {i === currentPlayerIndex && (
                <div className="scoreboard__avatar-crown">👑</div>
              )}
            </div>

            {/* 情報 */}
            <div className="scoreboard__player-info">
              <div className="scoreboard__player-name">{p.name}</div>
              <div className="scoreboard__player-sub">
                周回:{p.lapsCompleted} / 参加:{p.participationCount}
              </div>
            </div>

            {/* ポイント表示 */}
            <div className="scoreboard__player-right">
              <div className="scoreboard__player-pts">{p.points}<span>pt</span></div>
              <button
                className="scoreboard__bonus-btn"
                title="ボーナス+5pt"
                onClick={() => dispatch({ type: 'BONUS_POINT', playerIndex: i })}
              >
                ✨+5
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* コントロール */}
      <div className="scoreboard__controls">
        <button
          className={`btn btn-sm ${assistMode ? 'btn-blue' : 'btn-ghost'}`}
          onClick={() => dispatch({ type: 'TOGGLE_ASSIST_MODE' })}
        >
          💡 {assistMode ? '補助ON' : '補助OFF'}
        </button>
        <button className="btn btn-sm btn-red" onClick={onEndSession}>
          🏁 終了
        </button>
      </div>
    </div>
  );
}
