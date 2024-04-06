export default class Output {
    constructor(command, lines, isComplete) {
        this.command = command || '';
        this.lines = lines || [];
        this.isComplete = isComplete || false;
    }
}

