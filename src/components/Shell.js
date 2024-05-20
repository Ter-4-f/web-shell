import React, { createRef, useState } from 'react';
import './Shell.css';
import { connectionManager, createShell, readOutput, sendCommand, sendSignal } from '../services/ShellService';
import AnsiConverter from 'ansi-to-html';
import { v4 as uuidv4 } from 'uuid';

const ConnectionStatus = Object.freeze({
    OFFLINE:   Symbol("offline"),
    CONNECTING:  Symbol("connecting"),
    CONNECTED: Symbol("connected")
});

function toUnicodeEscape(char) {
    const num = char.charCodeAt(0);
    // Ensure the number is within the valid range for Unicode (0 to 65535)
    if (num < 0 || num > 65535) {
      throw new RangeError('Number must be between 0 and 65535');
    }
  
    // Convert the number to a hexadecimal string
    let hexString = num.toString(16);
  
    // Pad the string with leading zeros if necessary to ensure it's 4 digits
    while (hexString.length < 4) {
      hexString = '0' + hexString;
    }
  
    // Return the formatted Unicode escape sequence
    return '\\u' + hexString;
  }

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
        if (uncommitedData === formatted) htmlLine = <div key={uuidv4()} className='stdout'>{uncommitedData}</div>;
        else                    htmlLine = <div key={uuidv4()} className='stdout' dangerouslySetInnerHTML={{__html: formatted}} />;

        return htmlLine;
    }

    removeUncomittedLines () {
        this.cursorPosition = 0;
        this.uncommitedData = this.uncommitedData.map(function () {});
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
            () => { if (this.onUpdate) this.onUpdate(); }
        );
        this.connection = ConnectionStatus.OFFLINE;
        this.scrollToBottom = true;
    }

    insertCommand (value, execute) {
        this.handleEnter(value, execute);
    }
}


class Shell extends React.Component {
    constructor(props) {
        super(props);
        this.info = connectionManager.getShell(this.props.info.shellId);
        this.autoScroll = true;
        this.info.onUpdate = () => this.forceUpdate();
        this.info.handleEnter = (value, withEnter) => this.handleEnter(value, withEnter);
        this.inputKey = uuidv4();
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

    handleKeyDown = async (e) => {
        if (e.key === 'Enter') { this.handleEnter(undefined, true) }
        
        else if (e.key === 'ArrowUp')    { sendSignal(this.info.shellId, "\\u001b[A"); }
        else if (e.key === 'ArrowDown')  { sendSignal(this.info.shellId, "\\u001b[B"); }
        else if (e.key === 'ArrowRight') { sendSignal(this.info.shellId, "\\u001b[C"); }
        else if (e.key === 'ArrowLeft')  { sendSignal(this.info.shellId, "\\u001b[D"); }
        
        else if (e.key === 'Backspace') { sendSignal(this.info.shellId, "\\u0008"); }
        else if (e.key === 'Delete')    { sendSignal(this.info.shellId, "\\u007f"); }
        else if (e.key === 'Tab')       { sendSignal(this.info.shellId, "\\u0009"); }
        else if (e.key === 'Shift') { }
        
        else if (e.key === 'v' && e.ctrlKey) { const text = await navigator.clipboard.readText(); sendSignal(this.info.shellId, text); }
        else if (e.key === 'c' && e.ctrlKey) { sendSignal(this.info.shellId, "\\u0003"); }
        
        else if (e.key.length > 1) { return; }

        else { sendSignal(this.info.shellId, toUnicodeEscape(e.key)); }
        
        // console.log("Key", e.key, e.keyCode, toUnicodeEscape(e.key));
        e.stopPropagation();
        e.preventDefault();
    }

    handleEnter (value, withEnter) {
        const text = `${value ? value : ''}${withEnter ? "\\u000A" : ''}`;
        sendSignal(this.info.shellId, text);

        // const input = document.getElementById(this.inputKey);
        // const command = value? value : input.value;
        // input.value = "";
        // this.info.parser.removeUncomittedLines();
        // // TODO send input signals to SSH and dont save in inpuit element

        // sendCommand(this.info.shellId, command)
        //     .catch(err => {
        //         alert("Unable to execute command", err)
        //     });
    }
    
    onScroll (e) {
        if (e.deltaY < 0) {
            this.autoScroll = false;
        } else {
            const outElement = document.getElementById(this.info.shellId + '_shell');
            if (outElement) 
                this.autoScroll = Math.abs(outElement.scrollHeight - outElement.scrollTop - outElement.clientHeight) - e.deltaY <= 1;                
        }
    }

    updateCursor () {
        // const cursorheight = this.output ? this.output.scrollHeight : "0";
        // if (!this.uncommited) {
        //     return;
        // }
        
        // this.myInp.style.left = rect.left + "px";
        // const left = `calc(${this.output.getBoundingClientRect().left}px + ${this.info.parser.cursorPosition}ch)`
        // this.myInp.style.top = rect.top + "px";
        this.myInp.style.left = this.info.parser.cursorPosition + "ch";
        this.myInp.style.bottom = 0 + "px";
    }
    
    focusInput () {
        var selection = window.getSelection();
        if(selection.type != "Range") {
            this.myInp.focus();
        }
    }
    
    componentDidUpdate () {
        if (this.inited) {
            this.updateCursor();
        }
    }

    componentDidMount () {
        setTimeout(() => { 
            this.updateCursor();
            this.inited = true;
        }, 800);
    }
   

    render() {
        const uncommitedData = this.info.parser.loadUncommitedData();
        const uncommitedOutput = <div ref={(uncom) => this.uncommited = uncom} >{this.info.parser.parseUncommitedData(uncommitedData)}</div>;
        
        return (
            <div id={this.props.info.shellId + '_shell'} className="shell" onClick={e => this.focusInput()} onWheel={(e) => {this.onScroll(e)}} >
                <div id={this.props.info.shellId + '_output'} className="outputs">
                    <div className="output" ref={(out) => this.output = out}> 
                        <div className='commitedLines'>{this.info.output}</div>
                        {uncommitedOutput}
                        <input id={this.inputKey} ref={(ip) => this.myInp = ip} className='prompt' onKeyDown={this.handleKeyDown} />
                    </div>
                    {this.autoScroll ? <div ref={(el) => { if(el) el.scrollIntoView({ behavior: "smooth" });}}></div> : <></>}
                </div>
            </div>
        );
    }
};

export default Shell;
