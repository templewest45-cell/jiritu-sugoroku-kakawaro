import type { GameAction } from '../../store/gameStore';
import { content1 } from '../../data/content-1';
import { content2 } from '../../data/content-2';
import { content3 } from '../../data/content-3';
import './TeacherGuide.css';

interface Props {
  dispatch: React.Dispatch<GameAction>;
}

const allContents = [content1, content2, content3];

export function TeacherGuide({ dispatch }: Props) {
  return (
    <div className="teacher-guide">
      <div className="teacher-guide__header">
        <h2>🧑‍🏫 教師向け解説・実装コンテンツ一覧</h2>
        <button 
          className="btn btn-ghost"
          onClick={() => dispatch({ type: 'GO_TO_TITLE' })}
        >
          ← タイトルに戻る
        </button>
      </div>

      <div className="teacher-guide__content">
        <div className="guide-overview">
          <div className="guide-overview__box">
            <h3>🌟 アプリのねらい</h3>
            <p>
              本アプリは、特別支援学校の自立活動における「人間関係の形成」を目的としたすごろく型学習教材です。
              児童生徒が遊びながら自然にコミュニケーションの基本や、他者の感情理解、自己調整のスキルを学ぶことができます。
              また、「アシストモード」を活用することで、文字を読むのが苦手な生徒でも音声によるサポートを受けながら自立して取り組めるよう設計されています。
            </p>
          </div>

          <div className="guide-overview__box guide-overview__box--result">
            <h3>📊 リザルト画面（まとめ）の構成と振り返りへの活用</h3>
            <p>ゲーム終了後の「まとめ画面」には、以下の記録が表示されます。これらを活用し、活動後の振り返り学習を深めることができます。</p>
            <ul>
              <li>
                <strong>📸 活動中の写真記録：</strong>
                カメラを使用したミニゲームでの表情やポーズの写真が一覧表示されます。<br/>
                <em>【活用例】「〇〇さんの笑顔が素敵だったね」「この時、みんなで協力して同じポーズができたね」と視覚的に達成感を共有します。</em>
              </li>
              <li>
                <strong>📋 達成した課題リスト：</strong>
                誰がどのミッションやチャレンジをクリアしたかが一覧で残ります。<br/>
                <em>【活用例】「Aさんは『ありがとう』を上手に言えたね」と、具体的な行動を褒める根拠として使用します。</em>
              </li>
              <li>
                <strong>📝 先生のメモ：</strong>
                ゲーム中に先生が記録した「良い行動」や「頑張り」がカードとして表示されます。<br/>
                <em>【活用例】帰りの会や次の授業の冒頭で、「先生はこんな素敵な姿を見つけていましたよ」と全体の前で価値づけるために提示します。</em>
              </li>
              <li>
                <strong>🏆 チームポイント：</strong>
                個人戦ではなく「みんなで集めた合計ポイント」と獲得したトロフィーが表示されます。<br/>
                <em>【活用例】「みんなで協力したからこんなにポイントが集まったね」と、集団としての連帯感・自己肯定感を高めます。</em>
              </li>
            </ul>
          </div>
        </div>

        <h3 className="guide-section-main-title">各区分の実装コンテンツ一覧</h3>

        {allContents.map(content => (
          <div key={content.divisionId} className={`guide-section guide-section--div${content.divisionId}`}>
            <h3 className="guide-section__title">
              <span className="guide-section__badge">区分 {content.divisionId}</span>
              {content.name}
            </h3>
            
            <div className="guide-section__goal">
              <strong>🎯 指導目標：</strong>
              <p>{content.goal}</p>
            </div>

            <div className="guide-grid">
              {/* ミニゲーム一覧 */}
              <div className="guide-card">
                <h4 className="guide-card__title">🎮 実装済みミニゲーム ({content.minigames.length}種)</h4>
                <ul className="guide-list">
                  {content.minigames.map(mg => (
                    <li key={mg.id}>
                      <span className="mg-type">[{mg.type === 'camera' ? '📷 カメラ' : mg.type === 'mic' ? '🎤 マイク' : '👆 タップ'}]</span>
                      <strong>{mg.name}</strong>
                      <p>{mg.description}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ミッション一覧 */}
              <div className="guide-card">
                <h4 className="guide-card__title">🚩 赤マス・ミッション課題 ({content.missions.length}種)</h4>
                <p className="guide-card__desc">※全員参加型・協力型の課題</p>
                <ul className="guide-list">
                  {content.missions.map(ms => (
                    <li key={ms.id}>{ms.text}</li>
                  ))}
                </ul>
              </div>

              {/* 青マス チャレンジ一覧 */}
              <div className="guide-card guide-card--full">
                <h4 className="guide-card__title">⭐ 青マス チャレンジ課題 ({content.challenges.length}種)</h4>
                <p className="guide-card__desc">※個人で取り組む課題（アシストモードでの代読対応可）</p>
                <div className="guide-grid-columns">
                  <ul className="guide-list">
                    {content.challenges.slice(0, 8).map(ch => (
                      <li key={ch.id}>{ch.text}</li>
                    ))}
                  </ul>
                  <ul className="guide-list">
                    {content.challenges.slice(8).map(ch => (
                      <li key={ch.id}>{ch.text}</li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
