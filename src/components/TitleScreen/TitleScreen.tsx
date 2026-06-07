import './TitleScreen.css';
import type { GameAction } from '../../store/gameStore';

interface Props {
  dispatch: React.Dispatch<GameAction>;
}

export function TitleScreen({ dispatch }: Props) {
  return (
    <div className="title-screen">
      <div className="title-bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="title-content">
        <div className="title-badge">自立活動アプリ「じりつすごろく」シリーズ</div>

        <div className="title-icon-row">
          <span className="title-icon bounce-1">🎲</span>
          <span className="title-icon bounce-2">✨</span>
          <span className="title-icon bounce-3">🎲</span>
        </div>

        <h1 className="title-heading">
          じりつすごろく<br />
          <span className="title-accent">かかわろう</span>
        </h1>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#64748b', marginTop: '-1rem', marginBottom: '1rem' }}>
          （人間関係の形成）
        </div>

        <p className="title-sub">みんなで楽しく活動しよう！</p>

        <div className="title-players">
          <span>👤</span>
          <span>👤</span>
          <span>👤</span>
          <span>👤</span>
          <small>最大4名でプレイ</small>
        </div>

        <button
          className="btn btn-primary btn-xl title-start-btn"
          onClick={() => dispatch({ type: 'GO_TO_DIVISION_SELECT' })}
        >
          🎮 ゲームをはじめる
        </button>

        <div style={{ marginTop: '2rem' }}>
          <button
            className="btn btn-ghost"
            style={{ fontSize: '1.2rem', padding: '0.8rem 2rem', border: '2px solid rgba(0,0,0,0.1)', background: 'white' }}
            onClick={() => dispatch({ type: 'GO_TO_TEACHER_GUIDE' })}
          >
            🧑‍🏫 教師向け解説・実装コンテンツ一覧
          </button>
        </div>
      </div>

      <div className="title-footer">
        タブレット1台で完結 • 大型モニターへの投影対応
      </div>
    </div>
  );
}
