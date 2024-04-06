import React, { createRef, useState } from 'react';
import { ReactComponent  as ResumeIcon } from '../icons/resume.svg';
import { ReactComponent  as PauseIcon } from '../icons/pause.svg';
import { ReactComponent  as ReloadIcon } from '../icons/reload.svg';
import { ReactComponent  as CancelIcon } from '../icons/x.svg';
import './Shell.css';
import { createShell, readOutput } from '../services/ShellService';
import determineShellname from '../utils/ShellUtils';

const ConnectionStatus = Object.freeze({
    OFFLINE:   Symbol("offline"),
    CONNECTING:  Symbol("connecting"),
    CONNECTED: Symbol("connected")
});

class ShellOutput extends React.Component {
    constructor(props) {
        super(props);
        this.shellId = props.id;
        this.lines = [];


        readOutput(props.id, (line) => this.addLine(line));
    }

    addLine (line) {
        console.log("Line", line);
        this.lines.push(line);
        this.forceUpdate();
    }

    output () {
        return this.lines.map((line, index) => {
            return <div key={index} className={`output-line stdout`}>{line}</div>
        });
    }

    render() {
        return (
            <div className="output">
                <div className='lines'>{this.output()}</div>
            </div>
        );
    }
}

class Shell extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            connection: ConnectionStatus.OFFLINE
        };

        if (props.autoConnect) {
            this.connectShell(false);
        }
    }

    connectShell (mounted) {
        if (mounted)
            this.setState({connection: ConnectionStatus.CONNECTING});
        else
            this.state.connection = ConnectionStatus.CONNECTING;

        if (this.props.id) {
            this.output = <ShellOutput id={this.props.id} />;
            if (mounted)
                this.setState({connection: ConnectionStatus.CONNECTED});
            else
                this.state.connection = ConnectionStatus.CONNECTED;
        } else {
            createShell(this.props.location, "pwd").then(dto => {
                this.setState({
                    connection: ConnectionStatus.CONNECTED
                });

                this.id = dto.id;
                this.createdAt = dto.createdAt;
                this.output = <ShellOutput id={dto.id} />;

                if (this.props.setName) {
                    this.props.setName(determineShellname(this.createdAt));
                }
                if (this.props.onConnected) {
                    this.props.onConnected(this, dto);
                }
            })
            .catch(err => {
                this.setState({connection: ConnectionStatus.OFFLINE});
                alert(err);                
            });            
        }
    }

    renderOutputs () {
        if (this.state.connection === ConnectionStatus.OFFLINE) {
            return <button onClick={() => this.connectShell(true)}>Connect</button>;
        } else if (this.state.connection === ConnectionStatus.CONNECTING) {
            return <>Connecting...</>;
        }

        return this.output;
    }

    render() {
        return (
            <div className="shell">
                <div className="outputs">
                    {this.renderOutputs()}
                </div>
                <div className="input-line">
                    <span className="cwd"></span>
                    <input type="text"/>
                </div>
            </div>
        );
    }
};

export default Shell;
