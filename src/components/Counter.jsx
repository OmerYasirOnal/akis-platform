import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  const handleIncrement = () => setCount((prev) => prev + 1);
  const handleDecrement = () => setCount((prev) => prev - 1);
  const handleReset = () => setCount(0);

  const getValueClass = () => {
    if (count > 0) return 'counter-value positive';
    if (count < 0) return 'counter-value negative';
    return 'counter-value zero';
  };

  return (
    <div className="counter-card">
      <div className="counter-display">
        <span className="counter-label">Mevcut Değer</span>
        <span className={getValueClass()}>{count}</span>
      </div>
      <div className="counter-buttons">
        <button className="btn btn-decrement" onClick={handleDecrement} aria-label="Azalt">
          −
        </button>
        <button className="btn btn-reset" onClick={handleReset} aria-label="Sıfırla" title="Sıfırla">
          ↺
        </button>
        <button className="btn btn-increment" onClick={handleIncrement} aria-label="Artır">
          +
        </button>
      </div>
      <p className="counter-info">
        {count === 0 ? 'Saymaya başlamak için bir butona tıklayın' : `Toplam ${Math.abs(count)} adım ${count > 0 ? 'artırıldı' : 'azaltıldı'}`}
      </p>
    </div>
  );
}

export default Counter;