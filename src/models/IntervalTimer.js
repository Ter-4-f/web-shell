export default class IntervalTimer {

    constructor(activeSeconds, breakSeconds, rounds) {
        this.rounds = rounds || 2;
        this.activeSeconds = activeSeconds || 60;
        this.breakSeconds = breakSeconds || 240;
    }

    getTotalTime () {
        return (this.rounds * this.activeSeconds) + 
              ((this.rounds -1) * this.breakSeconds);
    }
}