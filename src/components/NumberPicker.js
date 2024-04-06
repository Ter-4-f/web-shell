import React, { useCallback, useState } from 'react';
import './Picker.css'; // Import your CSS file for styling

const NumberPicker = ({ value, onChange, min, max }) => {
  const [startY, setStartY] = useState(null);
  const [startValue, setStartValue] = useState(value);

  const handleWheel = (e) => {
    const delta = Math.sign(e.deltaY) * -1;
    const newValue = Math.min(Math.max(value + delta, min), max);
    onChange(newValue);
    e.preventDefault();
  };

  const handleTouchStart = (e) => {
    setStartY(e.touches[0].clientY);
    setStartValue(value);
  };

  const handleTouchMove = (e) => {
    if (startY !== null) {
      const deltaY = startY - e.touches[0].clientY;
      const sensitivity = 10; // Adjust this value for sensitivity of swipe
      const deltaValue = Math.round(deltaY / sensitivity) * 1;
      const newValue = Math.min(Math.max(startValue + deltaValue, min), max);
      onChange(newValue);
    }
  };

  const handleTouchEnd = () => {
    setStartY(null);
  };

  const divRefCallback = useCallback(
    (node) => {
      if (node == null) {
        return;
      }
      node.addEventListener('wheel', handleWheel, { passive: false });
    },
    [handleWheel],
  );


  return (
    <div
      className="picker"
      ref={divRefCallback}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <span className="number">{value}</span>
    </div>
  );
};

export default NumberPicker;
