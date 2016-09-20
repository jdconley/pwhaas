"use strict";

export class Stopwatch {
    private startHrtime:number[];
    private accumulatedHrtime:number[];

    private running:boolean;

    constructor(autostart:boolean=true) {
        if (autostart) {
            this.start();
        }
    }

    private accumulate():number[] {
        const accumulated = this.accumulatedHrtime = this.accumulatedHrtime || [0, 0];
        const now = process.hrtime();

        if (!this.startHrtime) {
            return this.accumulatedHrtime;
        }

        const elapsed = [now[0] - this.startHrtime[0], now[1] + this.startHrtime[1]];
        accumulated[0] += elapsed[0];
        accumulated[1] += elapsed[1];

        const overflowSecs = Math.floor(accumulated[1] / 1e9);
        accumulated[0] += overflowSecs;
        accumulated[1] -= overflowSecs;

        if (this.isRunning()) {
            this.startHrtime = now;
        } else {
            this.startHrtime = null;
        }
    }

    isRunning():boolean {
        return this.running;
    }

    start():void {
        this.running = true;
        this.startHrtime = process.hrtime();
    }

    elapsedMilliseconds():number {
        const elapsed = this.accumulate();
        return elapsed[0] * 1e3 + elapsed[1] / 1e6;
    }

    stop():void {
        this.accumulate();
        this.running = false;
    }

    reset():void {
        if (this.isRunning()) {
            this.startHrtime = process.hrtime();
        } else {
            this.startHrtime = null;
        }

        this.accumulatedHrtime = null;
    }
}