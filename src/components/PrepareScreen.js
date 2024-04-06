import React, { useEffect, useRef, useState } from 'react';
import './Screens.css';

const PrepareScreen = ({ onDone }) => {
    const [time, setTime] = useState(5);
    const mounted = useRef();

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(prevTime => prevTime - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
        } else if (time <= 0) {
            onDone();
        }
    });

    return (
        <div className="max-size prepare-screen">
            <div className='timer'>{time}</div>
        </div>
    );
};

export default PrepareScreen;
