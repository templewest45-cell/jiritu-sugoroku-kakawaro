import './DivisionSelect.css';
import type { GameAction } from '../../store/gameStore';
import type { DivisionId } from '../../types/game';

interface Props {
  dispatch: React.Dispatch<GameAction>;
}

const divisions = [
  {
    id: 1 as DivisionId,
    name: '他者との関わりの基礎',
    desc: '人と関わることへの安心感・興味を育てる。「関わってみる」が起点',
    icon: '🤝',
    color: 'blue',
    gradient: 'linear-gradient(135deg, #2563eb, #60a5fa)',
    shadow: 'rgba(59, 130, 246, 0.4)',
  },
  {
    id: 2 as DivisionId,
    name: '他者の意図や感情の理解',
    desc: '相手の気持ち・意図を読み取り、それに応じた関わり方を学ぶ',
    icon: '💭',
    color: 'purple',
    gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    shadow: 'rgba(168, 85, 247, 0.4)',
  },
  {
    id: 3 as DivisionId,
    name: '自己の理解と行動の調整',
    desc: '自分の特徴・気持ち・行動パターンを知り、状況に合わせて調整する',
    icon: '🌱',
    color: 'green',
    gradient: 'linear-gradient(135deg, #16a34a, #4ade80)',
    shadow: 'rgba(34, 197, 94, 0.4)',
  },
];

export function DivisionSelect({ dispatch }: Props) {
  return (
    <div className="division-screen">
      <div className="division-header">
        <h2 className="division-title">今日の活動テーマを選ぼう</h2>
        <p className="division-subtitle">教師が指導目標に合わせて区分を選択してください</p>
      </div>

      <div className="division-cards">
        {divisions.map((div) => (
          <button
            key={div.id}
            className={`division-card division-card--${div.color}`}
            onClick={() => dispatch({ type: 'SELECT_DIVISION', divisionId: div.id })}
            style={{ '--card-gradient': div.gradient, '--card-shadow': div.shadow } as React.CSSProperties}
          >
            <div className="division-card__number">区分 ({div.id})</div>
            <div className="division-card__icon">{div.icon}</div>
            <div className="division-card__name">{div.name}</div>
            <div className="division-card__desc">{div.desc}</div>
            <div className="division-card__arrow">→</div>
          </button>
        ))}
      </div>

      <div className="division-note">
        ※ 区分(4) 集団への参加の基礎 はすごろく活動自体に内包されています
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button
          className="btn btn-ghost"
          style={{ fontSize: '1.2rem', padding: '0.8rem 2rem' }}
          onClick={() => dispatch({ type: 'GO_TO_TITLE' })}
        >
          ← タイトルに戻る
        </button>
      </div>
    </div>
  );
}
