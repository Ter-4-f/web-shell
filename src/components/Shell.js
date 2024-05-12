import React, { createRef, useState } from 'react';
import './Shell.css';
import { connectionManager, createShell, readOutput, sendCommand, sendSignal } from '../services/ShellService';
import AnsiConverter from 'ansi-to-html';

const ConnectionStatus = Object.freeze({
    OFFLINE:   Symbol("offline"),
    CONNECTING:  Symbol("connecting"),
    CONNECTED: Symbol("connected")
});

const sshPromptPattern = /^.+@.+:\S+\s*\$$/;
// const promptPattern = /^([^@]+)@([^:]+):(.+)\$\s?$/; // for user and address
const promptPattern = /^([^@]+@[^:]+):(.+)\$(.*)$/;
const ansiGraphicMode = /^\[\d+?(;\d+)*m$/;
const encoder = new TextEncoder();

class OutputParser {
    constructor (onAddLine, onUpdate) {
        this.insertModeOn = false;
        this.escapeModeOn = false;
        this.escapeCommand = "";
        this.cursorPosition = 0;
        this.onAddLine = onAddLine;
        this.onUpdate = onUpdate;
        this.ansiConverter = new AnsiConverter();
        this.uncommitedData = Array.apply(null, Array(5)).map(function () {});
    }

    parseInput () {
        const data = this.loadUncommitedData();
        const match = data.match(promptPattern);
        if (match) {
            console.log("line matched prompt", data, match[1], match[2], match[3])
            this.cursorPosition = match[1].length + match[2].length + 2; // +2 --> : and $
            const input = match[3];
            for (let i = this.cursorPosition; i < this.uncommitedData.length; i++) {
                this.uncommitedData[i] = undefined;                
            }

            return input
        }
        return "";
    }

    formattedPrompt (prompt) {
        if (prompt.includes("\u001b[")) {
            return this.parseUncommitedData(prompt);
        }
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

    loadUncommitedData () {
        let line = '';
        for (let i = 0; i < this.uncommitedData.length; i++) {
            if (this.uncommitedData[i] !== undefined) {
                line += this.uncommitedData[i];
            }
        }
        return line;
    }

    parseUncommitedData (uncommitedData) {
        let htmlLine;
        const formatted = this.ansiConverter.toHtml(uncommitedData);
        if (uncommitedData === formatted) htmlLine = <div key={crypto.randomUUID()} className='stdout'>{uncommitedData}</div>;
        else                    htmlLine = <div key={crypto.randomUUID()} className='stdout' dangerouslySetInnerHTML={{__html: formatted}} />;

        return htmlLine;
    }

    addLine () {
        this.cursorPosition = 0;
        const data = this.loadUncommitedData();
        const line = this.parseUncommitedData(data);
        this.uncommitedData = this.uncommitedData.map(function () {});
        this.onAddLine(line);
    }

    readChunk (chunk) {
        console.log("Parsing chunk\n", JSON.stringify(chunk));
        for (let i = 0; i < chunk.length; i++) {
            const char = chunk.charAt(i);

            if (this.escapeModeOn) {
                this.escapeCommand += char;

                if (this.escapeCommand === "[A") {
                    this.escapeCommand = "";
                    this.escapeModeOn = false;
                } else if (this.escapeCommand === "[?2004h") {
                    this.escapeCommand = "";
                    this.escapeModeOn = false;
                    this.insertModeOn = true
                } else if (this.escapeCommand === "[?2004l") {
                    this.escapeCommand = "";
                    this.escapeModeOn = false;
                    this.insertModeOn = false
                } else if (this.escapeCommand === "[K") {
                    this.escapeCommand = "";
                    this.escapeModeOn = false;
                    console.log("encountered [K at cursor posisiton", this.cursorPosition, this.uncommitedData);
                    for (let i = this.cursorPosition; i < this.uncommitedData.length; i++) {
                        this.uncommitedData[i] = undefined;                        
                    }
                } else if (this.escapeCommand.match(ansiGraphicMode)) {
                    this.escapeCommand = "\u001b" + this.escapeCommand;
                    for (let i = 0; i < this.escapeCommand.length; i++) {
                        this.uncommitedData[this.cursorPosition] = this.escapeCommand.charAt(i);
                        this.cursorPosition++;
                    }
                    
                    this.escapeCommand = "";
                    this.escapeModeOn = false;
                } else if (this.escapeCommand.length > 7) {
                    console.log("Long escape sequence: ", this.escapeCommand);
                } else {
                    // console.log("Escape char: ", char);
                }

                continue;
            }

            if (char === '\n') {
                this.addLine();
            } else if (char === '\r') { 
                this.cursorPosition = 0;
            } else if (char === '\u0000') { // null
            } else if (char === '\u0008') { // backspace
                const match = this.loadUncommitedData().match(promptPattern);
                if (match) {
                    continue;
                }
                this.cursorPosition -= 1;
            } else if (char === '\u001b') { // escape char
                this.escapeModeOn = true;
            } else {
                this.uncommitedData[this.cursorPosition] = char;
                this.cursorPosition++;
            }
        }

        this.onUpdate();
    }
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
        this.parser = new OutputParser(
            (line) => this.output.push(line),
            () => { 
                this.input = this.parser.parseInput();
                if (this.onUpdate) this.onUpdate(); 
            }
        );
        this.connection = ConnectionStatus.OFFLINE;
        this.scrollToBottom = true;
    }

    insertCommand (value, execute) {
        this.input = value;
        if (execute)
            this.handleEnter();

        this.onUpdate();
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
            console.log("Up");
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
        const uncommitedData = this.info.parser.loadUncommitedData();
        const isInputAvailable = uncommitedData.match(promptPattern) !== null;
        // const isInputAvailable = uncommitedData.match(promptPattern) && !uncommitedData.match(completePromptPattern);

        const cwdAndInput = isInputAvailable ? 
                            <div className='lastLine'>
                                <div className='output-line prompt'>{this.info.parser.formattedPrompt(uncommitedData)}</div>
                                <input type="text" className='shell-input'  onKeyDown={this.handleKeyDown} onInput={(e) => {this.info.input = e.target.value; this.forceUpdate();}} value={this.info.input}/>
                            </div> : <></>;

        const uncommitedOutput = isInputAvailable ? <></> : this.info.parser.parseUncommitedData(uncommitedData);
        
        return (
            <div id={this.props.info.shellId + '_shell'} className="shell" onClick={this.focusShell} onWheel={(e) => {this.onScroll(e)}} >
                <div id={this.props.info.shellId + '_output'} className="outputs">
                    <div className="output">
                        <div className='commitedLines'>{this.info.output}</div>
                        {isInputAvailable ? <></> : uncommitedOutput}
                    </div>
                    {cwdAndInput}
                    {this.autoScroll ? <div ref={(el) => { if(el) el.scrollIntoView({ behavior: "smooth" });}}></div> : <></>}
                </div>
            </div>
        );
    }
};

export default Shell;
