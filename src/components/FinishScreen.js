import React, { useState } from 'react';
import { ReactComponent  as ReloadIcon } from '../icons/reload.svg';
import { ReactComponent  as CancelIcon } from '../icons/x.svg';
import './Screens.css'; // CSS file for styling

const FinishScreen = ({ onDone, onReset }) => {  
    return (
        <div className="max-size finish-screen">
            <div>
                <div className='timer'>Finished!</div>
                <div className="buttons-container">
                    <div className={`buttons`}>
                        <CancelIcon className="icon main-icon" onClick={onDone} />
                        <ReloadIcon className="icon main-icon" onClick={onReset} />
                    </div>
                </div>                
            </div>
        </div>
    );
};

export default FinishScreen;
