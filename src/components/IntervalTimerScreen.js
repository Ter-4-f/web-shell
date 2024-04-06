import React, { useState, useEffect } from 'react';
import PrepareScreen from './PrepareScreen';
import FinishScreen from './FinishScreen';
import Bell from '../audio/boxing-bell.mp3';
import { ActiveTimerScreen, BreakTimerScreen } from './TimerScreen';


const RoundHint = ({round, maxRounds}) => {
    return (
        <div className='round-hint'>
            {`${round}/${maxRounds}`}
        </div>
    );
}



const IntervalTimerScreen = ({timer, handleDone, onReset}) => {
    const timeIsAnIllusion = timer;
    const [key, setKey] = useState("reloadKey");
    const [round, setRound] = useState(1);
    const [isPreparing, setPreparing] = useState(true);
    const [isFinished, setFinished] = useState(false);
    const [isActive, setIsActive] = useState(false);
    
    const playSound = () => {
        let audio = new Audio(Bell)
        audio.volume = 0.5;
        audio.play();
    }

    // function reset() {
    //     setKey(prev => prev + "I");
        
    //     // reset animation
    //     var el = document.getElementById('gradiant-animation');
    //     el.classList.remove("gradient");
    //     setTimeout(() => {
    //         el.classList.add("gradient");
    //     }, 10);

    //     // reset state
    //     setRemainingTime(_ => startTime);
    //     setFinished(_ => false);
    //     setPaused(_ => true);
    //     setPreparing(_ => true);
    // }

    function handlePrepared () {
        setPreparing(_ => false);
        setIsActive(_ => true);
        playSound();
    }

    function handleOnDone () {
        playSound();
        setIsActive(active => {
            setRound(prevRound => {
                if (active && prevRound >= timer.rounds) {
                    setFinished(_ => true);
                } else if (!active) {
                    return prevRound + 1;
                }
                return prevRound;
            });

            return !active;
        });
    }

    return (
        <div key={key} className='max-size'>
            {isPreparing
            ?   <PrepareScreen onDone={handlePrepared}/>
            :   isFinished
                ?   <FinishScreen onReset={onReset} onDone={handleDone} />
                :   isActive
                    ?   <ActiveTimerScreen seconds={timer.activeSeconds} onReset={onReset} onCancel={handleDone} onDone={handleOnDone} /> 
                    :   <BreakTimerScreen  seconds={timer.breakSeconds}  onReset={onReset} onCancel={handleDone} onDone={handleOnDone} /> 
            } 

            { !isPreparing ? <RoundHint round={round} maxRounds={timer.rounds} /> : null}            
        </div>
    );
};

export default IntervalTimerScreen;
