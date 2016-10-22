"use strict";

import * as argon2 from "argon2themax";
import { Stopwatch } from "./stopwatch";
import * as _ from "lodash";
import * as logging from "./logging";
import * as path from "path";
import * as os from "os";
const fsp = require("fs-promise");

export interface BenchOptions {
    maxTimeMs?: number;
    saltLength?: number;
    osTmpCache?: boolean;
    timingsPath?: string;
}

export const defaults: BenchOptions = {
    maxTimeMs: 250,
    saltLength: 32,
    osTmpCache: true,
    timingsPath: path.join(__dirname, "timings.json")
};

export class Bench {
    options: BenchOptions;
    selector: argon2.Selection.SelectionStrategy;
    private timingResult: argon2.Measurement.TimingResult;
    private logger = logging.getLogger("bench");

    async tryLoadTimings(path: string): Promise<boolean> {
        if (!path) {
            return false;
        }

        try {
            if (!await fsp.exists(path)) {
                return false;
            }

            this.timingResult = await fsp.readJson(path);

            if (this.timingResult && this.timingResult.timings) {
                this.logger.info(`Loaded ${this.timingResult.timings.length} timings from '${path}'`);
                return true;
            }

        } catch (err) {
            this.logger.error(`Unable to load timings from '${path}': `, err);
        }

        return false;
    }

    async init(options: BenchOptions = defaults): Promise<any> {
        this.options = _.assignIn({}, defaults, options);

        // See if we should load timings from the options path
        await this.tryLoadTimings(this.options.timingsPath);

        // Timings not loaded yet, load them from temp path
        const timingTmpPath = path.join(os.tmpdir(), "pwhaas-timings.json");
        if (this.options.osTmpCache && !this.timingResult) {
            await this.tryLoadTimings(timingTmpPath);
        }

        // No cached timings found
        if (!this.timingResult) {
            const timingStrategy = argon2.Measurement.getTimingStrategy(argon2.Measurement.TimingStrategyType.ClosestMatch);

            const sw = new Stopwatch();
            this.timingResult = await argon2.Measurement.generateTimings(
                this.options, timingStrategy);
            sw.stop();

            this.logger.info(`Found ${this.timingResult.timings.length} timings in ${sw.elapsed}ms`);

            // Store found timings
            if (this.options.osTmpCache && this.timingResult) {
                try {
                    await fsp.writeJson(timingTmpPath, this.timingResult);
                    this.logger.info(`OsTmpCache enabled. Wrote ${this.timingResult.timings.length} timings to '${timingTmpPath}'.`);
                } catch (err) {
                    this.logger.error(`Unable to write timings to '${timingTmpPath}': `, err);
                }
            }
        }

        this.selector = argon2.Selection.getSelectionStrategy(
            argon2.Selection.SelectionStrategyType.MaxCost);

        this.selector.initialize(this.timingResult);

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
        if (!this.timingResult || !this.timingResult.timings) {
            return [];
        }

        return _.cloneDeep(this.timingResult.timings);
    }

    getMaxTiming(maxTimeMs: number): argon2.Measurement.Timing {
        if (!this.selector) {
            return null;
        }

        return this.selector.select(maxTimeMs);
    }
}