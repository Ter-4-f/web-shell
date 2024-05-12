import React, { useState } from 'react';
import Shell from './Shell';
import Terminal from './Terminal';
import { HostStatus, pingHost } from '../services/PingService';
import './Server.css';
import { ReactComponent  as UpArrow } from './../icons/up_arrow.svg';
import './ServerStatus.css';


function ServerStatus ({ onWakeServer, onKillServer, status }) {
    return (
        <div className="w3-container ping-container">
            { status === HostStatus.INIT
            ? <div title="wake Up Server" className="status-btn init"></div>
            : status === HostStatus.UNKNOWN
                ? <div title="wake Up Server" className="status-btn unknown">?</div>
                : status === HostStatus.AWAKE
                    ? <button title="Shutdown NAS"   className="status-btn ok"   onClick={onKillServer}></button>
                    : <button title="wake Up Server" className="status-btn warn" onClick={onWakeServer}></button>
            }            
        </div>
    );
}


export default function Server ({ pcName, location, insertLines, executeLines }) {
    const [activeShell, setActiveShell] = useState(null);
    const [showServer, setShowServer] = useState(localStorage.getItem(pcName) === "true");
    const [pingStatus, setPingStatus] = useState(HostStatus.INIT);


    if (pingStatus === HostStatus.INIT) {
        pingHost(location).then(status => setPingStatus(status));
    }

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

    const insertCommand = (command) => {
        if (activeShell) 
            activeShell.insertCommand(command, false);
    };

    const executeCommand = (command )=> {
        if (activeShell) 
            activeShell.insertCommand(command, true);
    };

    const onKillServer = ()=> {
        if (activeShell) 
            activeShell.insertCommand(command, true);
    };

    const toggleVisibility = () => {
        setShowServer(prev => {
            localStorage.setItem(pcName, !prev);
            return !prev;
        });
    }

    const serverEntry = <div className="server-entry">
                        <div className='button-grid'>   
                            <div className="buttons">{insertButtons}</div>
                            <div className="buttons">{executeButtons}</div>
                        </div>
                        { pingStatus === HostStatus.AWAKE 
                        ?   <Terminal location={location} setActiveShell={(shell) => setActiveShell(shell)}/>
                        :   <></>
                        }
                        
                        
                        <ServerStatus status={pingStatus} onKillServer={onKillServer}/>
                    </div>;

    return (
        <div className="server">
            <button className='server-header' onClick={toggleVisibility}>
                <h1>{pcName}</h1>
                { showServer 
                    ? <UpArrow className="server-arrow" />
                    : <UpArrow className="server-arrow not-visible" />
                }
                
            </button>
            { showServer 
                ? serverEntry
                : <></>
            }

            
        </div>
    );
};
