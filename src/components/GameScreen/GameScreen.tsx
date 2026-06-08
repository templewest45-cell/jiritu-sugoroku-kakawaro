import './GameScreen.css';
import type { GameState } from '../../types/game';
import type { GameAction } from '../../store/gameStore';
import { Board } from '../Board/Board';
import { Dice } from '../Dice/Dice';
import { ScoreBoard } from '../ScoreBoard/ScoreBoard';
import { EventModals } from '../EventModals/EventModals';
import { getContent } from '../../store/gameStore';
import { SQUARE_NAMES, SQUARE_ICONS } from '../../utils/board';
import { useEffect } from 'react';

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

  useEffect(() => {
    if (eventPhase === 'animatingMove') {
      let stepsLeft = lastDiceValue ?? 0;
      if (stepsLeft <= 0) {
        dispatch({ type: 'MOVE_COMPLETE' });
        return;
      }
      const interval = setInterval(() => {
        dispatch({ type: 'STEP_MOVE' });
        stepsLeft--;
        if (stepsLeft <= 0) {
          clearInterval(interval);
          setTimeout(() => {
            dispatch({ type: 'MOVE_COMPLETE' });
          }, 500); // 0.5秒待ってから到着判定
        }
      }, 500); // 1マス0.5秒で移動
      return () => clearInterval(interval);
    }
  }, [eventPhase, lastDiceValue, dispatch]);

  const currentRound = Math.ceil(turn / players.length);

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
            <div className="game-header__turn-badge" style={{ fontSize: '1.2rem', padding: '4px 12px', background: '#3b82f6', color: '#fff' }}>
              {currentRound}ターン目
            </div>
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
                onClick={() => dispatch({ type: 'START_MOVE_ANIMATION' })}
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

      {/* 止まったマスの確認 */}
      {eventPhase === 'arrived' && state.currentEvent.type && (
        <div className="modal-overlay">
          <div className="modal-box text-center" style={{ maxWidth: '400px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              {SQUARE_NAMES[state.currentEvent.type]} にとまった！
            </h2>
            <div style={{ fontSize: '4rem', margin: '1rem 0' }}>
              {SQUARE_ICONS[state.currentEvent.type]}
            </div>
            <button
              className="btn btn-primary btn-lg mt-4"
              onClick={() => dispatch({ type: 'SHOW_EVENT' })}
            >
              イベントを見る
            </button>
          </div>
        </div>
      )}

      {/* ミニゲームのイントロ */}
      {eventPhase === 'minigameIntro' && state.pendingMinigame && (
        <div className="modal-overlay">
          <div className="modal-box text-center" style={{ maxWidth: '500px' }}>
            <div style={{ fontSize: '4rem', margin: '1rem 0' }}>🎮</div>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#3b82f6' }}>
              第{currentRound - 1}ターン終了！<br/>みんなでミニゲーム！
            </h2>
            <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--color-text-muted)' }}>
              全員で協力してミニゲームに挑戦しよう！
            </p>
            <button
              className="btn btn-primary btn-lg"
              style={{ padding: '16px 48px', fontSize: '1.5rem' }}
              onClick={() => dispatch({ type: 'SHOW_MINIGAME' })}
            >
              ミニゲームをはじめる！
            </button>
          </div>
        </div>
      )}

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
