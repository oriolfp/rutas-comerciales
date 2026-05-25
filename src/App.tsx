import { useState } from 'react';
import { AproperMeuView } from './components/AproperMeuView';
import { LiniesView } from './components/LiniesView';
import { ModeToggle, type AppMode } from './components/ModeToggle';
import './App.css';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('linies');

  return (
    <div className="app">
      <header className="app-header">
        <div className="tmb-logo">TMB</div>
        <div className="app-title">
          <h1>Línies de Transport</h1>
          <span>Barcelona · Àrea Metropolitana</span>
        </div>
        <ModeToggle value={appMode} onChange={setAppMode} />
      </header>
      {appMode === 'linies' ? <LiniesView /> : <AproperMeuView />}
    </div>
  );
}
