import React from 'react';
import './App.css';
import Counter from './components/Counter';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Basit Sayaç</h1>
        <p className="app-subtitle">Sayacı artırın veya azaltın</p>
      </header>
      <main className="app-main">
        <Counter />
      </main>
    </div>
  );
}

export default App;