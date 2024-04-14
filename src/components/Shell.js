import React, { createRef, useState } from 'react';
import { ReactComponent  as ResumeIcon } from '../icons/resume.svg';
import { ReactComponent  as PauseIcon } from '../icons/pause.svg';
import { ReactComponent  as ReloadIcon } from '../icons/reload.svg';
import { ReactComponent  as CancelIcon } from '../icons/x.svg';
import './Shell.css';
import { createShell, readOutput, sendCommand } from '../services/ShellService';
import determineShellname from '../utils/ShellUtils';
import AnsiConverter from 'ansi-to-html';

const ConnectionStatus = Object.freeze({
    OFFLINE:   Symbol("offline"),
    CONNECTING:  Symbol("connecting"),
    CONNECTED: Symbol("connected")
});

const promptRegex = /[$#]\s*$/;

class ShellOutput extends React.Component {
    constructor(props) {
        super(props);
        this.shellId = props.id;
        this.lines = [];
        this.lastLine = "";
        this.ansiConverter = new AnsiConverter();

        this.state = {
            isInputVisible: false,
            lineCount: 0
        };

        readOutput(props.id, (line) => this.addLine(line));

        // this.props.afterInit(this);
    }

    addLine (line) {
        if (line.includes("\u001b[?2004h")) {
            this.insertModeOn = true;
        }

        if (line.includes("\u001b[?2004l")) {
            this.insertModeOn = false;
        }

        this.setState({
            isInputVisible: this.insertModeOn,
            lineCount: this.state.lineCount++
        });

        line = line.replace("\u001b[?2004h", "")
                .replace("\u001b[?2004l", "")
                .trim();

        const formatted = this.ansiConverter.toHtml(line);
        console.log("Line", line);
        console.log("With isnertMode", this.insertModeOn); 

        if (this.insertModeOn) {
            this.lastLine += line;
        } else {
            if (this.lastLine != "") {
                this.lines.push(<div key={crypto.randomUUID()} className='stdout'>{this.lastLine}</div>);
                this.lastLine = "";
            }

            if (line.length === 0)  
                return;

            if (line === formatted) {
                this.lines.push(<div key={crypto.randomUUID()} className='stdout'>{line}</div>);
            } else 
                this.lines.push(<div key={crypto.randomUUID()} className='stdout' dangerouslySetInnerHTML={{__html: formatted}} />);
                // this.lines.push(formatted);
        }
    }

    render() {
        return (
            <div>
                <div className="output">
                    <div className='lines'>{this.lines}</div>
                </div>
                <div className='lastLine'>
                    <div className='output-line prompt'>{this.lastLine}</div>
                    {this.state.isInputVisible ? this.props.children : null}
                </div>
            </div>
        );
    }
}

class Shell extends React.Component {
    constructor(props) {
        super(props);
        this.info = props.info;
        this.info.shell = this;
        this.info.insertCommand = this.insertCommand;

        this.state = {
            connection: ConnectionStatus.OFFLINE
        };

        if (props.autoConnect) {
            this.connectShell(false);
        }

        this.input = <input type="text" className='shell-input' onKeyDown={this.handleKeyDown} />;
        this.output = <ShellOutput id={this.info.id} toggleInputVisibility={(val) => this.toggleInputVisibility(val)}>{this.input}</ShellOutput>;
    }

    connectShell (mounted) {
        if (mounted)
            this.setState({connection: ConnectionStatus.CONNECTING});
        else
            this.state.connection = ConnectionStatus.CONNECTING;

        if (this.info.id) {
            this.output = <ShellOutput id={this.info.id} toggleInputVisibility={(val) => this.toggleInputVisibility(val)} />;
            if (mounted)
                this.setState({connection: ConnectionStatus.CONNECTED});
            else
                this.state.connection = ConnectionStatus.CONNECTED;
        } else {
            createShell(this.props.location, "").then(dto => {
                this.setState({
                    connection: ConnectionStatus.CONNECTED
                });

                this.info.id = dto.id;
                this.info.createdAt = dto.createdAt;
                this.info.name = determineShellname(dto.createdAt);
                this.output = <ShellOutput id={dto.id} toggleInputVisibility={(val) => this.toggleInputVisibility(val)} />;

                if (this.props.onCreatedSession) {
                    this.props.onCreatedSession();
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

    toggleInputVisibility (value) {
        this.setState({isInputVisible: value})
    }

    focusShell (shell) {
        const collection = shell.target.getElementsByClassName('shell-input');
        console.log("Taerget", collection);

        if (collection.length === 1) {
            collection[0].focus();
        }
    }

    insertCommand (command, execute) {
        console.log("Execute ", command, execute);
    }

    handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            const command = e.target.value
            e.target.value = "";

            console.log('Enter!', command);
            sendCommand(this.info.id, command)
            .catch(err => {
                alert("Unable to execute command", err)
            });

        }
    }

    render() {
        return (
            <div className="shell" onClick={this.focusShell}>
                <div className="outputs">
                    {this.renderOutputs()}
                </div>
            </div>
        );
    }
};

export default Shell;
