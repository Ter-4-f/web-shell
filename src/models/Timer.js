export default class Timer {
    constructor(rounds, activeSeconds, breakSeconds) {
        this.rounds = rounds || 2;
        this.activeSeconds = activeSeconds || 0;
        this.breakSeconds = breakSeconds || 0;
    }

    getTotalTime () {
        return (this.rounds * this.activeSeconds) + 
              ((this.rounds -1) * this.breakSeconds);
    }

    static from(json){
        return Object.assign(new Timer(), json);
    }
}