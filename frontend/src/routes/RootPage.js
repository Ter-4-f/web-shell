import React, { useState, useEffect } from 'react';
import TimerPicker from '../components/TimerPicker';
import { formatTimer } from '../utils/TimeUtils';
import './RootPage.css';
import Timer from '../models/Timer';
import NumberPicker from '../components/NumberPicker';
import { useSearchParams } from 'react-router-dom';
import CountdownPage from './CountdownPage';
import CountdownScreen from '../components/CountdownScreen';
import IntervalTimerScreen from '../components/IntervalTimerScreen';

const storedTime = localStorage.getItem("timeTime") || 0;
const storedIntervalTimer = localStorage.getItem("intervalTimerTime");
const intervalTimer = storedIntervalTimer ? Timer.from(JSON.parse(storedIntervalTimer)) : new Timer();

const RootPage = () => {
    const [timeSceenVisible, setTimeSceenVisible] = useState(window.location.hash && window.location.hash.substring(1) === "timer");
    const [intervalTimeSceenVisible, setIntervalTimeSceenVisible] = useState(window.location.hash && window.location.hash.substring(1) === "interval");
    const [timer, setTimer] = useState(parseInt(storedTime));
    const [intervalMaxTime, setIntervalMaxTime] = useState(intervalTimer.getTotalTime());
    const [showTimer, setShowTimer] = useState(false);
    const [showIntervalTimer, setShowIntervalTimer] = useState(false);
    
    const [resetKey, setResetKey] = useState("Key");
    
    const handleClickTimer = () => {
        setShowTimer(prev => !prev);
        setShowIntervalTimer(_ => false);
    };

    const handleClickIntervalTimer = () => {
        setShowTimer(_ => false);
        setShowIntervalTimer(prev => !prev);
    };

    const handleDone = () => {
        setTimeSceenVisible(_ => false);
        setIntervalTimeSceenVisible(_ => false);
        history.pushState("", document.title, window.location.pathname + window.location.search);
    };

    function handleReset () {
        setResetKey(prev => prev += "I");
    };

    return (
        <div className='screen'>
            { timeSceenVisible || intervalTimeSceenVisible ? "" :
            <div className='screen background'>
                <button className='selection' onClick={handleClickTimer}>
                    <span>Timer</span>
                    <div className="grower"></div>
                    <span className="time">{formatTimer(timer)}</span>             
                </button>
                {showTimer ? <TimerConfig setTime={setTimer} time={timer} setTimeSceenVisible={setTimeSceenVisible}/>: null}
                <button className='selection' onClick={handleClickIntervalTimer}>
                    <span>IntervalTimer</span>
                    <div className="grower"></div>
                    <span className="time">{formatTimer(intervalTimer.getTotalTime())}</span>             
                </button>
                {showIntervalTimer ? <IntervalTimerConfig intervalTimer={intervalTimer} setMaxTime={setIntervalMaxTime} setIntervalTimeSceenVisible={setIntervalTimeSceenVisible} />: null}
            </div>
            }
            { timeSceenVisible ?         <CountdownScreen key={resetKey} startTime={timer} handleDone={handleDone} onReset={handleReset} /> : ""}
            { intervalTimeSceenVisible ? <IntervalTimerScreen key={resetKey} timer={intervalTimer} handleDone={handleDone} onReset={handleReset} /> : ""}
        </div>
    );
};


const TimerConfig = ({time, setTime, setTimeSceenVisible}) => {
    const handleChange = (newValue) => {
        setTime(_ => newValue);
    }

    const onStart = () => {
        localStorage.setItem("timeTime", time);
        window.open(`/root#timer`,"_self");
        setTimeSceenVisible(_ => true);
    }
    
    return (
        <div className='config'>
            <div className='wrapper'>
                <TimerPicker value={time} onChange={handleChange} min={0} max={3600} />
                <button className='start-button' onClick={onStart}>Start</button>            
            </div>
        </div>
    );
};


const IntervalTimerConfig = ({intervalTimer, setMaxTime, setIntervalTimeSceenVisible}) => {
    const [_, setRounds] = useState(intervalTimer.rounds);
    const [__, setRoundSeconds] = useState(intervalTimer.activeSeconds);
    const [___, setBreakSeconds] = useState(intervalTimer.breakSeconds);

    const handleChangeRounds = (newValue) => {
        setRounds(_ => newValue)
        intervalTimer.rounds = newValue;
        setMaxTime(_ => intervalTimer.getTotalTime());
    }
    const handleChangeRoundSeconds = (newValue) => {
        setRoundSeconds(_ => newValue);
        intervalTimer.activeSeconds = newValue;
        setMaxTime(_ => intervalTimer.getTotalTime());
    }
    const handleChangeBreakSeconds = (newValue) => {
        setBreakSeconds(_ => newValue);
        intervalTimer.breakSeconds = newValue;
        setMaxTime(_ => intervalTimer.getTotalTime());
    }

    const onStart = () => {
        localStorage.setItem("intervalTimerTime", JSON.stringify(intervalTimer));
        window.open(`/root#interval`,"_self");
        setIntervalTimeSceenVisible(_ => true);
    }
    
    return (
        <div className='config'>
            <div className='wrapper'>
                <table>
                    <tbody>
                        <tr><td>Round Time</td><td><TimerPicker value={intervalTimer.activeSeconds} onChange={handleChangeRoundSeconds} min={0} max={3600} /></td></tr>
                        <tr><td>Break Time</td><td><TimerPicker value={intervalTimer.breakSeconds} onChange={handleChangeBreakSeconds} min={0} max={3600} /></td></tr>
                        <tr><td>Rounds</td><td><NumberPicker value={intervalTimer.rounds} onChange={handleChangeRounds} min={2} max={99} /></td></tr>
                    </tbody>
                </table>
                <button className='start-button' onClick={onStart}>Start</button>            
            </div>
        </div>
    );
};


export default RootPage;
