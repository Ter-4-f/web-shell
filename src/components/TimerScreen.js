import React, { useEffect, useRef, useState } from 'react';
import { ReactComponent  as ResumeIcon } from '../icons/resume.svg';
import { ReactComponent  as PauseIcon } from '../icons/pause.svg';
import { ReactComponent  as ReloadIcon } from '../icons/reload.svg';
import { ReactComponent  as CancelIcon } from '../icons/x.svg';
import GradientAnimation from './GradientAnimation';

export const TimerScreen = ({ seconds, onReset, onCancel, onDone, gradientStyle }) => {  
    const [time, setTime] = useState(seconds);
    const [isPaused, setIsPaused] = useState(false);
    const mounted = useRef();

    useEffect(() => {
        const interval = setInterval(() => {
            if (!isPaused) {
                setTime(prevTime => prevTime - 1);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isPaused]);

    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
        } else if (time <= 0) {
            onDone();
        }
    });

    const formattedCounter = () => {
        const minutes = Math.floor(time / 60);
        const remainder = time % 60;
        return `${minutes}:${remainder < 10 ? '0' : ''}${remainder}`;
    };

    const handlePause = () => {
        setIsPaused(prev => !prev);
    };

    return (
        <div className={`${gradientStyle} background-gradient max-size`}>
            <GradientAnimation isPaused={isPaused} time={seconds} gradientStyle={gradientStyle}></GradientAnimation>
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

export const BreakTimerScreen = ({ seconds, onReset, onCancel, onDone }) => {
    return (
        <TimerScreen seconds={seconds} onReset={onReset} onCancel={onCancel} onDone={onDone} gradientStyle={"break"}/>
    )
}

export const ActiveTimerScreen = ({ seconds, onReset, onCancel, onDone }) => {
    return (
        <TimerScreen seconds={seconds} onReset={onReset} onCancel={onCancel} onDone={onDone} gradientStyle={"active"}/>
    )
}