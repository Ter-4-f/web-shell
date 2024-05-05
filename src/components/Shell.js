import React, { createRef, useState } from 'react';
import { ReactComponent  as ResumeIcon } from '../icons/resume.svg';
import { ReactComponent  as PauseIcon } from '../icons/pause.svg';
import { ReactComponent  as ReloadIcon } from '../icons/reload.svg';
import { ReactComponent  as CancelIcon } from '../icons/x.svg';
import './Shell.css';
import { connectionManager, createShell, readOutput, sendCommand, sendSignal } from '../services/ShellService';
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
        this.input = "";
        this.isInputVisible = false;
        this.insertModeOn = false;
        this.ansiConverter = new AnsiConverter();
        this.connection = ConnectionStatus.OFFLINE;
        this.scrollToBottom = true;
    }

    insertCommand (value, execute) {
        this.input = value;
        if (execute)
            this.handleEnter();

        this.onUpdate();
    }

    addLine (line) {
        if (line.includes("\u001b[?2004h")) {
            this.insertModeOn = true;
        }
        if (line.includes("\u001b[?2004l")) {
            this.insertModeOn = false;
        }
        if (line.includes("\u0008")) {
            for (let i = 0; i < line.length; i++) {
                if (this.input.length > 0 && line.charAt(i) === "\u0008") {
                    this.input = this.input.substring(0, this.input.length - 1)
                }
            }
        }

        line = line.replace("\u001b[?2004h", "")
                .replace("\u001b[?2004l", "")
                .replaceAll("\u0000", "")
                .replaceAll("\u0008", "")
                .replaceAll("\u001b[K", "")
                .trim();

        if (this.insertModeOn) {
            if (sshPromptPattern.test(line))  {
                console.log("CWD", line);
                this.cwd = line + " ";
            }
            else if (line != "") {
                console.log("INPUT", line);
                this.input = line;
            }
                
            
            if (this.onUpdate)
                this.onUpdate();
        } else {
            if (this.cwd != "") {
                this.output.push(<div key={crypto.randomUUID()} className='stdout'>{formattedPrompt(this.cwd + this.input)}</div>);
                this.input = "";
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
        this.autoScroll = true;
        this.info.onUpdate = () => this.forceUpdate();
        this.info.handleEnter = () => this.handleEnter();
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

        if (collection.length === 1) {
            collection[0].focus();
        }
    }

    handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            this.handleEnter(e)
        }
        else if (e.key === 'ArrowUp') {
            sendSignal(this.info.shellId, "\\u001b[A")
                    .catch(err => {
                        alert("Unable to send signal", err)
                    });
        }
        else if (e.key === 'ArrowDown') {
            sendSignal(this.info.shellId, "\\u001b[B")
                    .catch(err => {
                        alert("Unable to send signal", err)
                    });
        }
    }

    handleEnter () {
        const command = this.info.input
        this.info.input = "";

        sendCommand(this.info.shellId, command)
            .catch(err => {
                alert("Unable to execute command", err)
            });
    }

    // componentDidUpdate () {
    //     console.log("===== Update");
    //     const outElement = this.info.scrollMark;
    //     if (this.info.scrollToBottom) {
    //         if (outElement) {
    //             console.log("=========================================================");
    //             outElement.scrollIntoView = outElement.scrollBackup;
    //             outElement.scrollIntoView({ behavior: "smooth" });
    //         }
    //     } else {
            
    //     }
    // }
    
    onScroll (e) {
        if (e.deltaY < 0) {
            this.autoScroll = false;
        } else {
            const outElement = document.getElementById(this.info.shellId + '_shell');
            if (outElement) 
                this.autoScroll = Math.abs(outElement.scrollHeight - outElement.scrollTop - outElement.clientHeight) - e.deltaY <= 1;                
        }
    }

    render() {
        const cwdAndInput = <div className='lastLine'>
                                <div className='output-line prompt'>{formattedPrompt(this.info.cwd)}</div>
                                <input type="text" className='shell-input'  onKeyDown={this.handleKeyDown} onInput={(e) => {this.info.input = e.target.value; this.forceUpdate();}} value={this.info.input}/>
                            </div>;

        return (
            <div id={this.props.info.shellId + '_shell'} className="shell" onClick={this.focusShell} onWheel={(e) => {this.onScroll(e)}} >
                <div id={this.props.info.shellId + '_output'} className="outputs">
                    <div className="output">{this.info.output}</div>
                    {this.info.insertModeOn ? cwdAndInput : null}
                    {this.autoScroll ? <div ref={(el) => { if(el) el.scrollIntoView({ behavior: "smooth" });}}></div> : <></>}
                </div>
            </div>
        );
    }
};

export default Shell;
