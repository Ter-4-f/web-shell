import React, { useState } from 'react';
import { ReactComponent  as ResumeIcon } from '../icons/resume.svg';
import { ReactComponent  as PauseIcon } from '../icons/pause.svg';
import { ReactComponent  as ReloadIcon } from '../icons/reload.svg';
import { ReactComponent  as CancelIcon } from '../icons/x.svg';

const BreakTimerScreen = ({ seconds, onReset, onCancel, onDone }) => {  
    const [time, setTime] = useState(seconds);
    const [isPaused, setIsPaused] = useState(false);
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

    const formattedCounter = () => {
        const minutes = Math.floor(seconds / 60);
        const remainder = seconds % 60;
        return `${minutes}:${remainder < 10 ? '0' : ''}${remainder}`;
    };

    const handlePause = () => {
        setIsPaused(prev => !prev);
    };

    return (
        <div className='background-gradient-break max-size'>
            <GradientAnimation isPaused={isPaused} time={startTime}></GradientAnimation>
            <div className="max-size overlap centering">
                <div className='timer grower'>{formattedCounter()}</div>
                <div className="buttons-container">
                    <PauseIcon className={`icon main-icon ${isPaused ? "invisible" : ""}`} onClick={handlePause} />

                    <div className={`buttons ${isPaused ? "" : "invisible"}`}>
                        <CancelIcon className="icon" onClick={onCancel} />
                        <ResumeIcon className="icon main-icon" onClick={handlePause} />
                        <ReloadIcon className="icon" onClick={onReset} />
                    </div>
                </div>
            </div>
        </div>        
    );
};

export default BreakTimerScreen;
