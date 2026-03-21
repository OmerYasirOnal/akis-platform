import React from 'react';
import './App.css';
import Counter from './components/Counter.jsx';

function App() {
  return (
    <div className="app-wrapper">
      <header className="app-header">
        <h1 className="app-title">Basit Sayaç</h1>
        <p className="app-subtitle">Anlık sayımınızı kolayca takip edin</p>
      </header>
      <main className="app-main">
        <Counter />
      </main>
      <footer className="app-footer">
        <p>Sayfa yenilendiğinde sayaç sıfırlanır</p>
      </footer>
    </div>
  );
}

export default App;