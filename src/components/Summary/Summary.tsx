import './Summary.css';
import type { GameState } from '../../types/game';
import type { GameAction } from '../../store/gameStore';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export function Summary({ state, dispatch }: Props) {
  const { players, achievedTasks, teacherNotes, teamPoints, turn, capturedPhotos, divisionId } = state;
  const sorted = [...players].sort((a, b) => b.points - a.points);

  return (
    <div className="summary">
      <div className="summary__header">
        <div className="summary__confetti">🎊🏆🎊</div>
        <h2 className="summary__title">セッション終了！</h2>
        <p className="summary__meta">区分({divisionId}) • {turn - 1}ターン • チーム合計 {teamPoints}pt</p>
      </div>

      {/* ランキング */}
      <div className="summary__section">
        <h3 className="summary__section-title">🏅 ポイントランキング</h3>
        <div className="summary__ranking">
          {sorted.map((p, i) => (
            <div key={p.id} className={`summary__rank-row ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>
              <div className="summary__rank-num">{['🥇', '🥈', '🥉', '4️⃣'][i]}</div>
              <div className="summary__rank-emoji">{p.emoji}</div>
              <div className="summary__rank-name">{p.name}</div>
              <div className="summary__rank-pts">{p.points}<span>pt</span></div>
              <div className="summary__rank-detail">参加ターン数: {p.participationCount}回</div>
            </div>
          ))}
        </div>
      </div>

      {/* 達成課題 */}
      {achievedTasks.length > 0 && (
        <div className="summary__section">
          <h3 className="summary__section-title">✅ 達成した課題一覧 ({achievedTasks.length}件)</h3>
          <div className="summary__tasks">
            {achievedTasks.map((t, i) => (
              <div key={i} className="summary__task-row">
                <span className="summary__task-player">{t.playerName}</span>
                <span className="summary__task-text">{t.taskText}</span>
                <span className="summary__task-turn">T{t.turn}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 写真 */}
      {capturedPhotos.length > 0 && (
        <div className="summary__section">
          <h3 className="summary__section-title">📷 撮影した写真 ({capturedPhotos.length}枚)</h3>
          <div className="summary__photos">
            {capturedPhotos.map((src, i) => (
              <img key={i} src={src} alt={`撮影 ${i+1}`} className="summary__photo" />
            ))}
          </div>
        </div>
      )}

      {/* 教師メモ */}
      {teacherNotes.length > 0 && (
        <div className="summary__section">
          <h3 className="summary__section-title">📝 教師メモ ({teacherNotes.length}件)</h3>
          <div className="summary__notes">
            {teacherNotes.map((n, i) => (
              <div key={i} className="summary__note-row">
                <span className="summary__note-player">{n.playerName}</span>
                <span className="summary__note-text">{n.text}</span>
                <span className="summary__note-turn">T{n.turn}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="summary__actions">
        <button className="btn btn-ghost btn-lg" onClick={() => window.print()}>
          🖨️ 印刷 / スクリーンショット
        </button>
        <button className="btn btn-primary btn-lg" onClick={() => dispatch({ type: 'GO_TO_DIVISION_SELECT' })}>
          🎮 もう一度プレイ
        </button>
      </div>
    </div>
  );
}
