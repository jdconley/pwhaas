"use strict";

export class Stopwatch {
    private started: [number, number];
    elapsed: number;

    constructor() {
        this.start();
    }

    start() {
        this.started = process.hrtime();
        this.elapsed = 0;
    }

    stop(): number {
        const elapsedHr = process.hrtime(this.started);
        return this.elapsed = elapsedHr[0] * 1e3 + elapsedHr[1] / 1e6;
    }
}

