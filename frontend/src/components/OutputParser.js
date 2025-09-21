import React from 'react';
import './Shell.css';
import AnsiConverter from 'ansi-to-html';
import { v4 as uuidv4 } from 'uuid';


const promptPattern = /^([^@]+@[^:]+):(.+)\$(.*)$/;
const ansiGraphicMode = /^\[\d+?(;\d+)*m$/;

export default class OutputParser {
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