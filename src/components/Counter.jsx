import React, { useState, useRef } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  const [bump, setBump] = useState(false);
  const timeoutRef = useRef(null);

  const triggerBump = () => {
    setBump(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setBump(false), 150);
  };

  const handleIncrement = () => {
    setCount(prev => prev + 1);
    triggerBump();
  };

  const handleDecrement = () => {
    setCount(prev => prev - 1);
    triggerBump();
  };

  return (
    <div className="counter-card">
      <span className="counter-label">Mevcut Değer</span>
      <div className={`counter-display${bump ? ' bump' : ''}`}>
        {count}
      </div>
      <div className="counter-buttons">
        <button
          className="btn btn-decrement"
          onClick={handleDecrement}
          aria-label="Azalt"
        >
          −
        </button>
        <button
          className="btn btn-increment"
          onClick={handleIncrement}
          aria-label="Artır"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default Counter;