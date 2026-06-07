import { useReducer } from 'react';
import './index.css';
import { gameReducer, initialState } from './store/gameStore';
import { TitleScreen } from './components/TitleScreen/TitleScreen';
import { DivisionSelect } from './components/DivisionSelect/DivisionSelect';
import { PlayerSetup } from './components/PlayerSetup/PlayerSetup';
import { GameScreen } from './components/GameScreen/GameScreen';
import { Summary } from './components/Summary/Summary';
import { TeacherGuide } from './components/TeacherGuide/TeacherGuide';

function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {state.phase === 'title' && (
        <TitleScreen dispatch={dispatch} />
      )}
      {state.phase === 'divisionSelect' && (
        <DivisionSelect dispatch={dispatch} />
      )}
      {state.phase === 'playerSetup' && state.divisionId && (
        <PlayerSetup dispatch={dispatch} divisionId={state.divisionId} />
      )}
      {state.phase === 'playing' && (
        <GameScreen state={state} dispatch={dispatch} />
      )}
      {state.phase === 'summary' && (
        <Summary state={state} dispatch={dispatch} />
      )}
      {state.phase === 'teacherGuide' && (
        <TeacherGuide dispatch={dispatch} />
      )}
    </div>
  );
}

export default App;
