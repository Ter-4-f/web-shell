import React, { useState } from 'react';
import { ReactComponent  as ResumeIcon } from '../icons/resume.svg';
import { ReactComponent  as PauseIcon } from '../icons/pause.svg';
import { ReactComponent  as ReloadIcon } from '../icons/reload.svg';
import { ReactComponent  as CancelIcon } from '../icons/x.svg';

const ActiveTimer = ({ isPaused, seconds, handlePause, handleReset, handleDone }) => {  
    const formattedCounter = () => {
        const minutes = Math.floor(seconds / 60);
        const remainder = seconds % 60;
        return `${minutes}:${remainder < 10 ? '0' : ''}${remainder}`;
    };

    return (
        <div className="max-size centering">
            <div className='timer grower'>{formattedCounter()}</div>
            <div className="buttons-container">
                <PauseIcon className={`icon main-icon ${isPaused ? "invisible" : ""}`} onClick={handlePause} />

                <div className={`buttons ${isPaused ? "" : "invisible"}`}>
                    <CancelIcon className="icon" onClick={handleDone} />
                    <ResumeIcon className="icon main-icon" onClick={handlePause} />
                    <ReloadIcon className="icon" onClick={handleReset} />
                </div>
            </div>
        </div>
    );
};

export default ActiveTimer;
