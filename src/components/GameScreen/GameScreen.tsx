import './GameScreen.css';
import type { GameState } from '../../types/game';
import type { GameAction } from '../../store/gameStore';
import { Board } from '../Board/Board';
import { Dice } from '../Dice/Dice';
import { ScoreBoard } from '../ScoreBoard/ScoreBoard';
import { EventModals } from '../EventModals/EventModals';
import { getContent } from '../../store/gameStore';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export function GameScreen({ state, dispatch }: Props) {
  const {
    players,
    currentPlayerIndex,
    eventPhase,
    lastDiceValue,
    divisionId,
    teamPoints,
    assistMode,
    showTeamAward,
    turn,
  } = state;

  const currentPlayer = players[currentPlayerIndex];
  const content = divisionId ? getContent(divisionId) : null;
  const isIdle = eventPhase === 'idle';
  const isMoving = eventPhase === 'moving';
  const isRolling = eventPhase === 'rolling';

  return (
    <div className="game-screen">
      {/* ─── ヘッダー ─── */}
      <div className="game-header">
        <div className="game-header__left">
          <div className="game-header__div-badge">区分{divisionId}</div>
          <div className="game-header__div-name">{content?.name}</div>
        </div>

        {/* 現在プレイヤー表示（中央） */}
        {currentPlayer && (
          <div
            className="game-header__current"
            style={{ '--p-color': currentPlayer.color } as React.CSSProperties}
          >
            <div className="game-header__current-avatar-wrap">
              <img
                src={currentPlayer.avatarUrl}
                alt={currentPlayer.name}
                className="game-header__current-avatar"
              />
            </div>
            <div className="game-header__current-info">
              <div className="game-header__current-label">いまのターン</div>
              <div className="game-header__current-name">{currentPlayer.name}のターン</div>
            </div>
            <div className="game-header__turn-badge">T{turn}</div>
          </div>
        )}

        <div className="game-header__right">
          <div className="game-header__team-pts">
            <span className="game-header__team-pts-label">チーム</span>
            <span className="game-header__team-pts-value">{teamPoints}</span>
            <span className="game-header__team-pts-unit">pt</span>
          </div>
        </div>
      </div>

      {/* ─── メインエリア ─── */}
      <div className="game-main">
        {/* ボード */}
        <div className="game-board-area">
          <Board state={state} dispatch={dispatch} />
        </div>

        {/* サイドパネル */}
        <div className="game-side">
          {/* サイコロエリア */}
          <div className="game-dice-card">
            <div className="game-dice-card__title">
              {isMoving ? '🚀 移動確認' : isRolling ? '🎲 ロール中...' : '🎲 サイコロ'}
            </div>
            <Dice
              dispatch={dispatch}
              isRolling={isRolling}
              lastValue={lastDiceValue}
              disabled={!isIdle}
            />
            {isMoving && (
              <button
                className="btn btn-gold btn-lg game-move-btn"
                onClick={() => dispatch({ type: 'MOVE_COMPLETE' })}
              >
                ✅ {lastDiceValue}マス進む！
              </button>
            )}
          </div>

          {/* スコアボード */}
          <ScoreBoard
            players={players}
            currentPlayerIndex={currentPlayerIndex}
            teamPoints={teamPoints}
            assistMode={assistMode}
            dispatch={dispatch}
            onEndSession={() => dispatch({ type: 'END_SESSION' })}
          />
        </div>
      </div>

      {/* イベントモーダル */}
      <EventModals state={state} dispatch={dispatch} />

      {/* チーム表彰 */}
      {showTeamAward && (
        <div className="modal-overlay" onClick={() => dispatch({ type: 'DISMISS_TEAM_AWARD' })}>
          <div className="modal-box team-award">
            <div className="team-award__icon">🏆✨🏆</div>
            <div className="team-award__text">チーム合計<br />{teamPoints}pt 達成！</div>
            <p>みんなで一緒に頑張りました！</p>
            <button className="btn btn-gold btn-lg" onClick={() => dispatch({ type: 'DISMISS_TEAM_AWARD' })}>
              やったー！🎉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
