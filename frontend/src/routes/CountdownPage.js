import useSound from 'use-sound';
import Timer from '../models/Timer';
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import GradientAnimation from '../components/GradientAnimation';
import ActiveTimer from '../components/ActiveTimer';
import PrepareScreen from '../components/PrepareScreen';
import FinishScreen from '../components/FinishScreen';
import Bell from '../audio/boxing-bell.mp3';

const CountdownPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const minutes = parseInt(searchParams.get("minutes") || 0); // Retrieve minutes from URL params
    const seconds = parseInt(searchParams.get("seconds") || 0);
    const maxTime = minutes * 60 + seconds;

    const [key, setKey] = useState("reloadKey");
    const [isPreparing, setPreparing] = useState(true);
    const [isFinished, setFinished] = useState(false);
    const [isPaused, setPaused] = useState(true);
    const [remainingTime, setRemainingTime] = useState(maxTime); // Convert minutes to seconds
    const [progressPercentage, setProgressPercentage] = useState(100);
    const [counter, setCounter] = useState(new Timer(minutes, seconds));

        

    // const [playSound] = useSound('../audio/file_example_OOG_1MG.ogg');
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

            setCounter(prevCounter => prevCounter.decrement());
        }, 1000);

        return () => clearInterval(interval);
    }, [isPaused]);

    // Progress
    useEffect(() => {
        const percentage = ((minutes * 60 - remainingTime) / (minutes * 60)) * 100;
        setProgressPercentage(percentage);
    }, [remainingTime, minutes]);

    

    const handlePause = () => {
        setPaused(prev => !prev);
    };

    function reset() {
        setKey(prev => prev + "I");
        console.log("reset", key);
        // reset animation
        var el = document.getElementById('gradiant-animation');
        el.classList.remove("gradient");
        setTimeout(() => {
            el.classList.add("gradient");
          }, 10);

        // reset timer
        setRemainingTime(prevTime => maxTime);
        console.log("max Time", maxTime);
        setCounter(prev => prev.set(minutes, seconds));

        // reset state
        setFinished(f => false);
        setPaused(p => false);
        setPreparing(p => true);
    }

    function handlePrepared () {
        playSound();
        setPaused(p => false);
        setPreparing(p => false);
    }

    
    return (
        <div key={key} className='max-size'>
            {isPreparing ?
                <PrepareScreen onDone={handlePrepared}/> :
                <div className='background-gradient max-size'>
                    <GradientAnimation isPaused={isPaused} time={maxTime}></GradientAnimation>
                    <div className="max-size overlap">                                
                        { isFinished ? 
                            <FinishScreen isPaused={isPaused} timer={counter} handlePause={handlePause} handleReset={reset}/> : 
                            <ActiveTimer  isPaused={isPaused} timer={counter} handlePause={handlePause} handleReset={reset} /> 
                        }
                    </div>
                </div>
            }            
        </div>
    );
};

export default CountdownPage;
