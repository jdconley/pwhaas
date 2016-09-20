"use strict";

import * as os from "os";
import * as fs from "fs";

export interface ITimingComputation {
    async ():Promise<ITimingResult[]>;
}

export interface ITimingResult {
    timeCost: number;
    memoryCost: number;
    parallelism: number;
    computeTimeMs: number;
}

class TimingResult implements ITimingResult {
    timeCost: number;
    memoryCost: number;
    parallelism: number;
    computeTimeMs: number;
}

class Argon2iTiming {

}

export class Timing {
    static async calculate():Promise<any> {

    }
}