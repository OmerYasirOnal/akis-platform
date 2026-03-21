import React from 'react';
import './App.css';
import Counter from './components/Counter';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Sayaç Uygulaması</h1>
        <p className="app-subtitle">Sayacı artır veya azalt</p>
      </header>
      <main className="app-main">
        <Counter />
      </main>
      <footer className="app-footer">
        <p>Basit Sayaç &copy; 2024</p>
      </footer>
    </div>
  );
}

export default App;