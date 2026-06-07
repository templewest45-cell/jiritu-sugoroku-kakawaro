import { useState, useRef, useEffect } from 'react';
import './EventModals.css';
import type { GameState, RandomEventType } from '../../types/game';
import type { GameAction } from '../../store/gameStore';

interface Props {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const RANDOM_EVENT_INFO: Record<RandomEventType, { icon: string; name: string; desc: string }> = {
  swap: { icon: '🔄', name: 'いれかわりマス', desc: '任意の相手と点数を交換できます。誰と交換しますか？' },
  nominate: { icon: '☝️', name: '指名マス', desc: '誰かに課題を出す役になります！指名する人を選ぼう' },
  cooperate: { icon: '🤜🤛', name: '協力マス', desc: '隣の人と2人でペア課題に取り組みます！' },
  vote: { icon: '🗳️', name: 'ひみつ投票マス', desc: '「一番〇〇な人は？」を全員が同時に指さし発表しよう！' },
  present: { icon: '🎁', name: 'プレゼントマス', desc: '自分の5ptを誰かに贈れます。誰に贈りますか？' },
  time: { icon: '⏱️', name: 'タイムマス', desc: '10秒以内に全員で何かを達成するチャレンジです！' },
  warp: { icon: '🌀', name: 'ワープマス', desc: 'ランダムで別のマスへ移動します！' },
  card: { icon: '🃏', name: 'カードマス', desc: '教師がカードを引いてイベントを発動します（合理的配慮タイミング）' },
};

export function EventModals({ state, dispatch }: Props) {
  const { eventPhase, currentEvent, players, currentPlayerIndex, assistMode, pendingMinigame } = state;
  const currentPlayer = players[currentPlayerIndex];
  const [teacherNote, setTeacherNote] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  
  // カメラキャプチャ用
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCaptured, setIsCaptured] = useState(false);

  // マイクメーター用
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 入力系ミニゲーム用
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [showInputResult, setShowInputResult] = useState(false);
  const [inputVisibility, setInputVisibility] = useState<Record<number, boolean>>({});
  const [inputRewards, setInputRewards] = useState<{ playerIndex: number; points: number }[]>([]);

  // カメラ・マイクのクリーンアップ＆初期化
  useEffect(() => {
    // カメラ
    if (eventPhase === 'minigame' && pendingMinigame?.type === 'camera' && !isCaptured) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setIsCameraReady(true);
          }
        })
        .catch(err => console.error('Camera error:', err));
    }

    // マイク
    if (eventPhase === 'minigame' && pendingMinigame?.type === 'mic') {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          streamRef.current = stream;
          const audioCtx = new window.AudioContext();
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          audioContextRef.current = audioCtx;
          analyzerRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            if (!analyzerRef.current) return;
            analyzerRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            // 0〜100に正規化（簡易的）
            const volPercent = Math.min(100, Math.round((average / 128) * 100));
            setVolume(volPercent);
            animationFrameRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        })
        .catch(err => console.error('Mic error:', err));
    }

    // クリーンアップ
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      setIsCameraReady(false);

      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [eventPhase, pendingMinigame, isCaptured]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        dispatch({ type: 'ADD_PHOTO', dataUrl });
        setIsCaptured(true);
      }
    }
  };

  if (eventPhase === 'idle') return null;

  // ====== 青マス ======
  if (eventPhase === 'blueEvent' && currentEvent.content) {
    const challenge = currentEvent.content as { text: string };
    return (
      <div className="modal-overlay">
        <div className="modal-box event-modal event-modal--blue">
          <div className="event-modal__badge event-modal__badge--blue">⭐ 青マス チャレンジ</div>
          <div className="event-modal__player">
            <span style={{ fontSize: '2rem' }}>{currentPlayer?.emoji}</span>
            <strong>{currentPlayer?.name}のターン</strong>
          </div>
          <p className="event-modal__task">{challenge.text}</p>
          
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '2px solid rgba(59, 130, 246, 0.3)', padding: '12px 24px', borderRadius: '12px', color: 'var(--color-blue-light)', fontWeight: '900', fontSize: '1.4rem' }}>
            🎁 成功報酬: +10pt
          </div>

          {assistMode && (
            <div className="event-modal__assist">
              <div className="event-modal__assist-title">💡 補助モード</div>
              <div className="event-modal__choices">
                <button className="btn btn-blue btn-lg" onClick={() => dispatch({ type: 'BLUE_SUCCESS' })}>
                  ✅ できた！
                </button>
                <button className="btn btn-ghost btn-lg" onClick={() => dispatch({ type: 'BLUE_SKIP' })}>
                  🙏 むずかしかった
                </button>
              </div>
            </div>
          )}

          {!assistMode && (
            <div className="event-modal__actions">
              <button className="btn btn-green btn-lg" onClick={() => dispatch({ type: 'BLUE_SUCCESS' })}>
                ✅ できた！ +10pt
              </button>
              <button className="btn btn-ghost" onClick={() => dispatch({ type: 'BLUE_SKIP' })}>
                スキップ
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ====== 赤マス ======
  if (eventPhase === 'redEvent' && currentEvent.content) {
    const avoidanceTask = currentEvent.content as { text: string };
    return (
      <div className="modal-overlay">
        <div className="modal-box event-modal event-modal--red">
          <div className="event-modal__badge event-modal__badge--red">💢 赤マス！</div>
          <div className="event-modal__player">
            <span style={{ fontSize: '2rem' }}>{currentPlayer?.emoji}</span>
            <strong>{currentPlayer?.name}</strong>
          </div>
          <p className="event-modal__task">減点イベント！<br />
            <span className="event-modal__pts">-5pt</span> になります。<br />
            でも、次のチャレンジに成功すれば回避できるよ！
          </p>
          <div className="event-modal__challenge-prompt" style={{ background: '#fee2e2', padding: '16px', borderRadius: '12px', marginTop: '16px', fontWeight: 'bold', color: '#991b1b' }}>
            {avoidanceTask.text}
          </div>
          <div className="event-modal__actions">
            <button className="btn btn-green btn-lg" onClick={() => dispatch({ type: 'RED_AVOID' })}>
              🛡️ 回避成功！
            </button>
            <button className="btn btn-red btn-lg" onClick={() => dispatch({ type: 'RED_TAKE' })}>
              💢 -5pt 受け取る
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ====== ミッションマス ======
  if (eventPhase === 'missionEvent' && currentEvent.content) {
    const mission = currentEvent.content as { text: string };
    return (
      <div className="modal-overlay">
        <div className="modal-box event-modal event-modal--mission">
          <div className="event-modal__badge event-modal__badge--mission">🎯 全員ミッション！</div>
          <p className="event-modal__task">{mission.text}</p>

          <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '2px solid rgba(168, 85, 247, 0.3)', padding: '12px 24px', borderRadius: '12px', color: '#c4b5fd', fontWeight: '900', fontSize: '1.4rem', margin: '12px 0' }}>
            🎁 全員達成で: +15pt
          </div>

          <div className="event-modal__note-area">
            <label className="event-modal__note-label">📝 教師メモ（任意）</label>
            <textarea
              className="event-modal__note-input"
              placeholder="気づいたことや様子を記録..."
              value={teacherNote}
              onChange={e => setTeacherNote(e.target.value)}
              rows={2}
            />
          </div>

          <div className="event-modal__actions">
            <button
              className="btn btn-blue btn-lg"
              onClick={() => {
                if (teacherNote) {
                  dispatch({ type: 'ADD_TEACHER_NOTE', note: { playerName: currentPlayer?.name, text: teacherNote } });
                }
                setTeacherNote('');
                dispatch({ type: 'MISSION_CLEAR' });
              }}
            >
              🎉 達成！ +15pt
            </button>
            <button className="btn btn-ghost" onClick={() => { setTeacherNote(''); dispatch({ type: 'MISSION_FAIL' }); }}>
              未達成
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ====== ？マス ======
  if (eventPhase === 'randomEvent' && currentEvent.randomEventType) {
    const ev = RANDOM_EVENT_INFO[currentEvent.randomEventType];
    const needsTarget = currentEvent.randomEventType === 'swap' || currentEvent.randomEventType === 'present' || currentEvent.randomEventType === 'nominate';
    const otherPlayers = players.filter((_, i) => i !== currentPlayerIndex);

    return (
      <div className="modal-overlay">
        <div className="modal-box event-modal event-modal--random">
          <div className="event-modal__badge event-modal__badge--random">❓ ランダムイベント</div>
          <div className="event-modal__random-icon">{ev.icon}</div>
          <div className="event-modal__random-name">{ev.name}</div>
          <p className="event-modal__task">{ev.desc}</p>
          
          {currentEvent.content && (
            <>
              <div className="event-modal__challenge-prompt" style={{ background: '#e0f2fe', padding: '16px', borderRadius: '12px', marginTop: '16px', fontWeight: 'bold', color: '#0369a1', fontSize: '1.2rem' }}>
                💡 お題：{(currentEvent.content as { text: string }).text}
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '2px solid rgba(245, 158, 11, 0.3)', padding: '12px 24px', borderRadius: '12px', color: 'var(--color-gold)', fontWeight: '900', fontSize: '1.4rem', margin: '16px 0' }}>
                🎁 チャレンジ成功で: +5pt
              </div>
            </>
          )}

          {needsTarget && (
            <div className="event-modal__target-selector">
              <p className="event-modal__target-label">対象を選んでください:</p>
              <div className="event-modal__target-btns">
                {otherPlayers.map(p => {
                  const idx = players.indexOf(p);
                  return (
                    <button
                      key={p.id}
                      className={`event-modal__target-btn ${selectedTarget === idx ? 'selected' : ''}`}
                      style={{ '--p-color': p.color } as React.CSSProperties}
                      onClick={() => setSelectedTarget(idx)}
                    >
                      {p.emoji} {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="event-modal__actions">
            <button
              className="btn btn-gold btn-lg"
              disabled={needsTarget && selectedTarget === null}
              onClick={() => {
                const isTaskEvent = !!currentEvent.content;
                dispatch({ 
                  type: 'RANDOM_EVENT_DONE', 
                  payload: { 
                    targetPlayerIndex: selectedTarget !== null ? selectedTarget : undefined,
                    giftPoints: isTaskEvent ? 5 : 0
                  } 
                });
                setSelectedTarget(null);
              }}
            >
              決定・完了！
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ====== ゴール演出 ======
  if (eventPhase === 'goalCelebration') {
    return (
      <div className="modal-overlay">
        <div className="modal-box event-modal event-modal--goal">
          <div className="event-modal__confetti">🎊🎉🎊🎉🎊</div>
          <div className="event-modal__goal-icon">🏆</div>
          <div className="event-modal__goal-text">ゴール到達！</div>
          <div className="event-modal__player">
            <span style={{ fontSize: '2.5rem' }}>{currentPlayer?.emoji}</span>
            <strong style={{ fontSize: '1.5rem' }}>{currentPlayer?.name}</strong>
          </div>
          <p className="event-modal__pts event-modal__pts--big">+20pt ✨</p>
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
            みんなで拍手しよう！👏👏👏
          </p>
          <button
            className="btn btn-gold btn-xl"
            onClick={() => dispatch({ type: 'GOAL_DONE' })}
          >
            続ける
          </button>
        </div>
      </div>
    );
  }

  // ====== ミニゲーム ======
  if (eventPhase === 'minigame' && pendingMinigame) {
    const typeLabel = { camera: '📷 カメラ系', mic: '🎤 マイク系', input: '📱 入力系' }[pendingMinigame.type];
    return (
      <div className="modal-overlay">
        <div className="modal-box event-modal event-modal--minigame">
          <div className="event-modal__badge event-modal__badge--minigame">🎮 ミニゲーム発動！</div>
          <div className="event-modal__minigame-type">{typeLabel}</div>
          <div className="event-modal__minigame-name">{pendingMinigame.name}</div>
          <p className="event-modal__task">{pendingMinigame.description}</p>

          <div style={{ background: 'rgba(167, 139, 250, 0.1)', border: '2px solid rgba(167, 139, 250, 0.3)', padding: '12px 24px', borderRadius: '12px', color: '#c4b5fd', fontWeight: '900', fontSize: '1.4rem', margin: '8px 0' }}>
            🎁 参加ボーナス: 全員に +5pt
            {pendingMinigame.type === 'input' && <span style={{display:'block', fontSize:'1rem', marginTop:'4px', color:'var(--color-gold)'}}>🔍 かぶった人にはさらに +5pt！</span>}
          </div>
          
          {pendingMinigame.type === 'camera' && (
            <div className="event-modal__camera-area" style={{ margin: '16px 0', textAlign: 'center' }}>
              {!isCaptured ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxWidth: '400px', borderRadius: '8px', background: '#000' }} />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <div style={{ marginTop: '8px' }}>
                    <button className="btn btn-green" onClick={capturePhoto} disabled={!isCameraReady}>
                      📸 カシャッ！撮影する
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ padding: '16px', background: '#dcfce7', color: '#166534', borderRadius: '8px', fontWeight: 'bold' }}>
                  ✅ 写真を保存しました！まとめ画面で確認できます。
                </div>
              )}
            </div>
          )}

          {pendingMinigame.type === 'mic' && (
            <div className="event-modal__mic-area" style={{ width: '100%', maxWidth: '400px', margin: '24px auto', padding: '24px', background: 'rgba(0,0,0,0.1)', borderRadius: '16px' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '12px' }}>🎙️ 声の大きさメーター</div>
              <div style={{ position: 'relative', width: '100%', height: '40px', background: '#e2e8f0', borderRadius: '20px', overflow: 'hidden' }}>
                {/* ちょうどいい声のゾーン（例：40%〜70%） */}
                <div style={{ position: 'absolute', left: '40%', width: '30%', height: '100%', background: 'rgba(34, 197, 94, 0.3)' }} />
                
                {/* 現在のボリュームバー */}
                <div style={{ 
                  width: `${volume}%`, 
                  height: '100%', 
                  background: volume > 80 ? 'var(--color-red-light)' : volume > 40 ? 'var(--color-green)' : 'var(--color-blue)', 
                  transition: 'width 0.1s ease-out, background 0.2s',
                  borderRadius: '20px'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '8px', fontWeight: 'bold' }}>
                <span>小さい</span>
                <span style={{ color: 'var(--color-green)' }}>ちょうどいい！</span>
                <span>大きすぎ</span>
              </div>
            </div>
          )}

          {pendingMinigame.type === 'input' && (
            <div className="event-modal__input-area" style={{ width: '100%', margin: '20px 0', textAlign: 'left' }}>
              {!showInputResult ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {players.map((p, i) => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '2rem' }}>{p.emoji}</span>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input
                            type={inputVisibility[i] ? "text" : "password"}
                            value={inputs[i] || ''}
                            onChange={(e) => setInputs({ ...inputs, [i]: e.target.value })}
                            placeholder={`${p.name}さんの回答 (隠れます)`}
                            style={{ 
                              width: '100%', padding: '16px', paddingRight: '48px', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.2)', 
                              background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '1.2rem', fontFamily: 'inherit'
                            }}
                          />
                          <button
                            onClick={() => setInputVisibility({ ...inputVisibility, [i]: !inputVisibility[i] })}
                            style={{
                              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                              background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '1.5rem', cursor: 'pointer'
                            }}
                            title={inputVisibility[i] ? "文字を隠す" : "文字を見る"}
                          >
                            {inputVisibility[i] ? "👁️" : "🙈"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    className="btn btn-gold btn-xl"
                    style={{ width: '100%', marginTop: '24px' }}
                    onClick={() => {
                      // 一致判定 (共通点探しなど)
                      const valToPlayerIndices: Record<string, number[]> = {};
                      Object.entries(inputs).forEach(([idxStr, val]) => {
                        const trimmed = val.trim();
                        if (!trimmed) return;
                        if (!valToPlayerIndices[trimmed]) valToPlayerIndices[trimmed] = [];
                        valToPlayerIndices[trimmed].push(Number(idxStr));
                      });

                      const rewards: { playerIndex: number; points: number }[] = [];
                      Object.values(valToPlayerIndices).forEach(indices => {
                        if (indices.length >= 2) {
                          // かぶった人全員に +5pt
                          indices.forEach(idx => rewards.push({ playerIndex: idx, points: 5 }));
                        }
                      });
                      setInputRewards(rewards);
                      setShowInputResult(true);
                    }}
                  >
                    🔍 みんなの回答を見る！
                  </button>
                </>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '24px', borderRadius: '16px', border: '2px solid rgba(255,255,255,0.2)' }}>
                  <h4 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '1.8rem', color: 'var(--color-gold)', fontWeight: '900' }}>✨ 発表 ✨</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {players.map((p, i) => {
                      const isMatched = inputRewards.some(r => r.playerIndex === i);
                      return (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '1.6rem', fontWeight: 'bold' }}>
                          <span>{p.emoji} {p.name}:</span>
                          <span style={{ color: 'var(--color-blue-light)' }}>{inputs[i] || '（未入力）'}</span>
                          {isMatched && (
                            <span style={{ color: 'var(--color-gold)', marginLeft: 'auto', animation: 'popIn 0.3s ease forwards' }}>
                              🎉 かぶった！ +5pt
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {(pendingMinigame.type !== 'input' || showInputResult) && (
            <button
              className="btn btn-primary btn-xl"
              onClick={() => {
                setIsCaptured(false);
                
                // 参加ボーナス全員に+5pt
                const baseRewards = players.map((_, i) => ({ playerIndex: i, points: 5 }));

                if (pendingMinigame.type === 'input') {
                  setInputs({});
                  setInputVisibility({});
                  setShowInputResult(false);
                  
                  // inputRewards と baseRewards を合算
                  const finalRewards = [...baseRewards];
                  inputRewards.forEach(ir => {
                    const existing = finalRewards.find(r => r.playerIndex === ir.playerIndex);
                    if (existing) existing.points += ir.points;
                  });
                  dispatch({ type: 'MINIGAME_DONE', payload: finalRewards });
                  setInputRewards([]);
                } else {
                  dispatch({ type: 'MINIGAME_DONE', payload: baseRewards });
                }
              }}
            >
              完了！次のターンへ
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
