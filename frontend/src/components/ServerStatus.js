import React from 'react';
import { HostStatus } from '../services/PingService';
import './Server.css';
import './ServerStatus.css';


export default function ServerStatus ({ onWakeServer, onKillServer, status }) {
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
