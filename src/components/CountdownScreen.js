import useSound from 'use-sound';
import Timer from '../models/Timer';
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import GradientAnimation from './GradientAnimation';
import ActiveTimer from './ActiveTimer';
import PrepareScreen from './PrepareScreen';
import FinishScreen from './FinishScreen';
import Bell from '../audio/boxing-bell.mp3';

const CountdownScreen = ({startTime, handleDone}) => {
    const [key, setKey] = useState("reloadKey");
    const [isPreparing, setPreparing] = useState(true);
    const [isFinished, setFinished] = useState(false);
    const [isPaused, setPaused] = useState(true);
    const [remainingTime, setRemainingTime] = useState(startTime); 

    
    const playSound = () => {
        let audio = new Audio(Bell)
        audio.volume = 0.5;
        audio.play();
    }

    // Time
    useEffect(() => {
        const interval = setInterval(() => {
            if (isPaused) return;
            
            setRemainingTime(prevTime => {
                if (prevTime == 0) {
                    setFinished(f => true);
                    playSound();
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPaused]);

    const handlePause = () => {
        setPaused(prev => !prev);
    };

    function reset() {
        setKey(prev => prev + "I");
        
        // reset animation
        var el = document.getElementById('gradiant-animation');
        el.classList.remove("gradient");
        setTimeout(() => {
            el.classList.add("gradient");
        }, 10);

        // reset state
        setRemainingTime(_ => startTime);
        setFinished(_ => false);
        setPaused(_ => true);
        setPreparing(_ => true);
    }

    function handlePrepared () {
        setPreparing(_ => false);
        setPaused(_ => false);
        playSound();
    }
    
    return (
        <div key={key} className='max-size'>
            {isPreparing
            ?   <PrepareScreen onDone={handlePrepared}/>
            :   <div className='background-gradient max-size'>
                    <GradientAnimation isPaused={isPaused} time={startTime}></GradientAnimation>
                    <div className="max-size overlap">                                
                        { isFinished 
                          ? <FinishScreen isPaused={isPaused} seconds={remainingTime} handlePause={handlePause} handleReset={reset} handleDone={handleDone}/>
                          : <ActiveTimer  isPaused={isPaused} seconds={remainingTime} handlePause={handlePause} handleReset={reset} handleDone={handleDone} /> 
                        }
                    </div>
                </div>
            }            
        </div>
    );
};

export default CountdownScreen;
