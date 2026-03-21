import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  const handleIncrement = () => {
    setCount(prev => prev + 1);
  };

  const handleDecrement = () => {
    setCount(prev => prev - 1);
  };

  const getDisplayClass = () => {
    if (count > 0) return 'counter-display positive';
    if (count < 0) return 'counter-display negative';
    return 'counter-display zero';
  };

  return (
    <div className="counter-card">
      <span className="counter-label">Mevcut Değer</span>
      <div className={getDisplayClass()}>{count}</div>
      <div className="counter-buttons">
        <button className="btn btn-decrement" onClick={handleDecrement} aria-label="Azalt">
          −
        </button>
        <button className="btn btn-increment" onClick={handleIncrement} aria-label="Artır">
          +
        </button>
      </div>
    </div>
  );
}

export default Counter;