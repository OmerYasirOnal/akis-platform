import React, { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  const [bump, setBump] = useState(false);

  const triggerBump = () => {
    setBump(true);
    setTimeout(() => setBump(false), 150);
  };

  const increment = () => {
    setCount(prev => prev + 1);
    triggerBump();
  };

  const decrement = () => {
    setCount(prev => prev - 1);
    triggerBump();
  };

  const reset = () => {
    setCount(0);
  };

  return (
    <div className="counter-card">
      <div className={`counter-display${bump ? ' bump' : ''}`}>
        {count}
      </div>
      <span className="counter-label">Mevcut Değer</span>
      <div className="counter-buttons">
        <button className="btn btn-decrement" onClick={decrement} aria-label="Azalt">
          −
        </button>
        <button className="btn btn-increment" onClick={increment} aria-label="Artır">
          +
        </button>
      </div>
      <button className="counter-reset" onClick={reset}>
        Sıfırla
      </button>
    </div>
  );
}

export default Counter;