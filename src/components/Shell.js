import React, { createRef, useState } from 'react';
import { ReactComponent  as ResumeIcon } from '../icons/resume.svg';
import { ReactComponent  as PauseIcon } from '../icons/pause.svg';
import { ReactComponent  as ReloadIcon } from '../icons/reload.svg';
import { ReactComponent  as CancelIcon } from '../icons/x.svg';
import './Shell.css';
import { connectionManager, createShell, readOutput, sendCommand } from '../services/ShellService';
import determineShellname from '../utils/ShellUtils';
import AnsiConverter from 'ansi-to-html';

const ConnectionStatus = Object.freeze({
    OFFLINE:   Symbol("offline"),
    CONNECTING:  Symbol("connecting"),
    CONNECTED: Symbol("connected")
});

const sshPromptPattern = /^.+@.+:\S+\s*\$$/;
// const promptPattern = /^([^@]+)@([^:]+):(.+)\$\s?$/; // for user and address
const promptPattern = /^([^@]+@[^:]+):(.+)\$(.*)$/;

function formattedPrompt (prompt) {
    const match = prompt.match(promptPattern);
    console.log("Match", match, prompt);
    if (match) 
        return <>
            <span className='prompt-location'>{match[1]}</span>
            <span className='prompt-text'>:</span>
            <span className='prompt-path'>{match[2]}</span>
            <span className='prompt-text'>$</span>
            <span>{match[3]}</span>
        </>
    
    return <></>;
}


export class ShellInfo {
    constructor (shellId, name, onNext) {
        this.shellId = shellId;
        this.name = name;
        this.onNext = onNext;
        this.output = [];
        this.cwd = "";
        this.isInputVisible = false;
        this.insertModeOn = false;
        this.ansiConverter = new AnsiConverter();
        this.connection = ConnectionStatus.OFFLINE;
    }

    addLine (line) {
        if (line.includes("\u001b[?2004h")) {
            this.insertModeOn = true;
        }
        if (line.includes("\u001b[?2004l")) {
            this.insertModeOn = false;
        }

        line = line.replace("\u001b[?2004h", "")
                .replace("\u001b[?2004l", "")
                .trim();

        if (this.insertModeOn) {
            if (sshPromptPattern.test(line)) 
                line += " ";

            this.cwd += line;
            if (this.onUpdate)
                this.onUpdate();
        } else {
            if (this.cwd != "") {
                console.log("Pish", this.cwd);
                this.output.push(<div key={crypto.randomUUID()} className='stdout'>{formattedPrompt(this.cwd)}</div>);
                this.cwd = "";
            }

            if (line.length === 0)  
                return;

            let htmlLine;
            const formatted = this.ansiConverter.toHtml(line);
            if (line === formatted) {
                htmlLine = <div key={crypto.randomUUID()} className='stdout'>{line}</div>;
            } else 
                htmlLine = <div key={crypto.randomUUID()} className='stdout' dangerouslySetInnerHTML={{__html: formatted}} />;

            this.output.push(htmlLine);
            if (this.onUpdate) {
                this.onUpdate();
            };
        }
    }

}


class Shell extends React.Component {
    constructor(props) {
        super(props);
        this.info = connectionManager.getShell(props.info.shellId);
        this.info.insertCommand = this.insertCommand;
        this.info.onUpdate = () => this.forceUpdate();
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
            sendCommand(this.info.shellId, command)
                .catch(err => {
                    alert("Unable to execute command", err)
                });
        }
    }

    render() {
        const cwdAndInput = <div className='lastLine'>
                                <div className='output-line prompt'>{formattedPrompt(this.info.cwd)}</div>
                                <input type="text" className='shell-input' autoFocus onKeyDown={this.handleKeyDown} />
                            </div>;

        return (
            <div className="shell" onClick={this.focusShell}>
                <div className="outputs">
                    <div className="output">{this.info.output}</div>
                    {this.info.insertModeOn ? cwdAndInput : null}
                </div>
            </div>
        );
    }
};

export default Shell;