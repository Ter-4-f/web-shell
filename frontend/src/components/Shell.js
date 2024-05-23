import React from 'react';
import './Shell.css';
import { connectionManager, sendSignal } from '../services/ShellService';
import { v4 as uuidv4 } from 'uuid';
import OutputParser from './OutputParser';

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
        
        // else if (e.key === 'v' && e.ctrlKey) { const text = await navigator.clipboard.readText(); sendSignal(this.info.shellId, text); }
        else if (e.key === 'v' && e.ctrlKey) { return; }
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
        }, 100);
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
                        <input id={this.inputKey} ref={(ip) => this.myInp = ip} className='prompt' onKeyDown={this.handleKeyDown} onPaste={e => this.handleEnter((e.clipboardData || window.clipboardData).getData('Text'), false)} />
                    </div>
                    {this.autoScroll ? <div ref={(el) => { if(el) el.scrollIntoView({ behavior: "smooth" });}}></div> : <></>}
                </div>
            </div>
        );
    }
};

export default Shell;
