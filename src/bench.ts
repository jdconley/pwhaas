"use strict";

import * as argon2 from "argon2themax";
import { Stopwatch } from "./stopwatch";
import * as _ from "lodash";

export interface BenchOptions {
    maxTimeMs?: number;
    saltLength?: number;
}

export const defaults: BenchOptions = {
    maxTimeMs: 250,
    saltLength: 32
};

export class Bench {
    options: BenchOptions;
    selector: argon2.Selection.SelectionStrategy;

    async init(options: BenchOptions = defaults): Promise<any> {
        this.options = _.assignIn({}, defaults, options);

        const timingStrategy = argon2.Measurement.getTimingStrategy(argon2.Measurement.TimingStrategyType.ClosestMatch);

        const sw = new Stopwatch();
        const result = await argon2.Measurement.generateTimings(
            this.options, timingStrategy);
        sw.stop();

        console.log(`Found ${result.timings.length} timings in ${sw.elapsed}ms`);

        this.selector = argon2.Selection.getSelectionStrategy(
            argon2.Selection.SelectionStrategyType.ClosestMatch);

        this.selector.initialize(result);

        // Lookup common values to warmup the cache
        for (let ms = 50; ms <= 1000; ms += 50) {
            this.selector.select(ms);
        }
    }

    getMaxTiming(maxTimeMs: number): argon2.Measurement.Timing {
        return this.selector.select(maxTimeMs);
    }
}