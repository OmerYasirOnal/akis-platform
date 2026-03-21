import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  const handleIncrease = () => setCount((prev) => prev + 1);
  const handleDecrease = () => setCount((prev) => prev - 1);
  const handleReset = () => setCount(0);

  const displayClass =
    count > 0 ? 'counter-display positive'
    : count < 0 ? 'counter-display negative'
    : 'counter-display zero';

  return (
    <div className="counter-card">
      <span className="counter-label">Sayaç</span>
      <div className={displayClass} aria-live="polite" aria-label={`Sayaç değeri: ${count}`}>
        {count}
      </div>
      <div className="counter-buttons">
        <button className="btn btn-decrease" onClick={handleDecrease} aria-label="Azalt">
          −
        </button>
        <div className="counter-reset-row">
          <button className="btn btn-reset" onClick={handleReset} aria-label="Sıfırla">
            ↺
          </button>
          <span className="reset-label">Sıfırla</span>
        </div>
        <button className="btn btn-increase" onClick={handleIncrease} aria-label="Artır">
          +
        </button>
      </div>
    </div>
  );
}

export default Counter;