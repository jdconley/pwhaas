"use strict";

import * as argon2 from "argon2themax";
import { Stopwatch } from "./stopwatch";
import * as _ from "lodash";
import * as logging from "./logging";

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
    private timings: argon2.Measurement.Timing[];
    private logger = logging.getLogger("bench");

    async init(options: BenchOptions = defaults): Promise<any> {
        this.options = _.assignIn({}, defaults, options);

        const timingStrategy = argon2.Measurement.getTimingStrategy(argon2.Measurement.TimingStrategyType.ClosestMatch);

        const sw = new Stopwatch();
        const result = await argon2.Measurement.generateTimings(
            this.options, timingStrategy);
        this.timings = result.timings;
        sw.stop();

        this.logger.info(`Found ${result.timings.length} timings in ${sw.elapsed}ms`);

        this.selector = argon2.Selection.getSelectionStrategy(
            argon2.Selection.SelectionStrategyType.ClosestMatch);

        this.selector.initialize(result);

        // Lookup common values to warmup the cache
        for (let ms = 50; ms <= 1000; ms += 50) {
            try {
                this.selector.select(ms);
            } catch (err) {
                this.logger.warn(`Error performing selector warmup for ${ms}ms. It's probably because this system is slow.`, err);
            }
        }
    }

    getTimings(): argon2.Measurement.Timing[] {
        return _.cloneDeep(this.timings);
    }

    getMaxTiming(maxTimeMs: number): argon2.Measurement.Timing {
        return this.selector.select(maxTimeMs);
    }
}