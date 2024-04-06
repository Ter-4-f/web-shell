import React, { useCallback, useState } from 'react';
import './Picker.css'; // Import your CSS file for styling

const TimerPicker = ({ value: seconds, onChange, min, max }) => {
  const [startY, setStartY] = useState(null);
  const [startValue, setStartValue] = useState(seconds);

  const handleWheel = (e) => {
    const delta = Math.sign(e.deltaY) * -10;
    const newValue = Math.min(Math.max(seconds + delta, min), max);
    onChange(newValue);
    e.preventDefault();
  };

  const handleTouchStart = (e) => {
    setStartY(e.touches[0].clientY);
    setStartValue(seconds);
  };

  const handleTouchMove = (e) => {
    if (startY !== null) {
      const deltaY = startY - e.touches[0].clientY;
      const sensitivity = 10; // Adjust this value for sensitivity of swipe
      const deltaValue = Math.round(deltaY / sensitivity) * 10;
      const newValue = Math.min(Math.max(startValue + deltaValue, min), max);
      onChange(newValue);
    }
  };

  const handleTouchEnd = () => {
    setStartY(null);
  };

  const formattedSeconds = () => {
    let minutes = Math.floor(seconds / 60);
    let remainder = seconds % 60;
    if (minutes < 10) 
        minutes = '0' + minutes;
    if (remainder === 0) 
        remainder = '00';

    return `${minutes}:${remainder}`;

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
      <span className="number">{formattedSeconds()}</span>
    </div>
  );
};

export default TimerPicker;
