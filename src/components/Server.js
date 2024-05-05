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


export default class Server extends React.Component {
// export default function Server ({ pcName, location, insertLines, executeLines }) {

    constructor(props) {
        super(props);
        // const [initShellName, setInitShellName] = useState("");
        this.activeShell = null;

        this.insertButtons = (this.props.insertLines || []).map((value, index) => {
            return (
                <button key={index} className="insert-line-btn" onClick={() => this.insertCommand(value.value)}>{value.label}</button>
            )
        });

        this.executeButtons = (this.props.executeLines || []).map((value, index) => {
            return (
                <button key={index} className="execute-line-btn" onClick={() => this.executeCommand(value.value)}>{value.label}</button>
            )
        });
    }

    insertCommand (command) {
        if (this.activeShell) 
            this.activeShell.insertCommand(command, false);
    };

    executeCommand (command) {
        if (this.activeShell) 
            this.activeShell.insertCommand(command, true);
    };

    render () {
        return (
            <div className="server-entry">
                <div>
                    <h1>{this.props.pcName}</h1>
                    <div className='button-grid'>   
                        <div className="buttons">{this.insertButtons}</div>
                        <div className="buttons">{this.executeButtons}</div>
                    </div>
                </div>
                <Terminal location={this.props.location} setActiveShell={(shell) => this.activeShell = shell}/>
                
                <ServerStatus/>
            </div>
        );
    }
};
