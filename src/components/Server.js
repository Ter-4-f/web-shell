import React, { useState } from 'react';
import Shell from './Shell';
import Terminal from './Terminal';
import './Server.css';


function ServerStatus ({ onWakeServer, onKillServer }) {
    return (
        <div className="w3-container ping-container">
            <button id="nas-btn-offline" title="wake Up Server" className="status-btn warn" disabled onClick={onWakeServer}></button>
            <button id="nas-btn-online" title="Shutdown NAS" className="status-btn ok" onClick={onKillServer}></button>
        </div>
    );
}


export default function Server ({ pcName, location, insertLines, executeLines }) {
    const [activeShell, setActiveShell] = useState(null);

    const insertCommand = (command) => {
        if (activeShell) 
            activeShell.props.info.insertCommand(command, false);
    };

    const executeCommand = (command) => {
        if (activeShell) 
            activeShell.insertCommand(command, false);
    };

    const onKillServer =  () => {

    };

    const onWakeServer =  () => {

    };

    const insertButtons = (insertLines || []).map((value, index) => {
        return (
            <button key={index} className="insert-line-btn" onClick={() => insertCommand(value.value)}>{value.label}</button>
        )
    });

    const executeButtons = (executeLines || []).map((value, index) => {
        return (
            <button key={index} className="execute-line-btn" onClick={() => executeCommand(value.value)}>{value.label}</button>
        )
    });

    return (
        <div className="server-entry">
            <div>
                <h1>{pcName}</h1>
                <div className='button-grid'>   
                    <div className="buttons">{insertButtons}</div>
                    <div className="buttons">{executeButtons}</div>
                </div>
            </div>
            <Terminal location={location} setActiveShell={setActiveShell}/>
            
            <ServerStatus/>
        </div>
    );
};
