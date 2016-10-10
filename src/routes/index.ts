
"use strict";

import * as express from "express";
import * as argon2 from "argon2themax";

import { Stopwatch } from "../stopwatch";
import { Bench } from "../bench";
import { User, HASH_MODE_ALL, HASH_MODE_DEFAULT } from "../user";

module Route {
    export interface Options {
        maxTimeMs?: number;
    }

    export class Index {
        constructor(private defaults: Options, private bench: Bench) {
        }

        public index(req: express.Request, res: express.Response, next: express.NextFunction) {
            res.render("index");
        }

        getOptions(user: User, req: express.Request): argon2.Options {
            if (user && user.hashMode === HASH_MODE_ALL) {
                const maxtime = Number(req.param("maxtime") || this.defaults.maxTimeMs);
                const timing = this.bench.getMaxTiming(maxtime);

                return timing.options;
            }

            return argon2.defaults;
        }

        public async hash(req: express.Request, res: express.Response, next: express.NextFunction): Promise<any> {
            const plain = req.param("plain");
            const maxtime = Number(req.param("maxtime") || this.defaults.maxTimeMs);
            const options = this.getOptions((req as any).user, req);

            const sw = new Stopwatch();
            const salt = await argon2.generateSalt(this.bench.options.saltLength);
            const saltTiming = sw.stop();

            sw.start();
            const hash = await argon2.hash(plain, salt, options);
            const hashTiming = sw.stop();

            res.json({hash, options, timing: {salt: saltTiming, hash: hashTiming}});
        }

        public async verify(req: express.Request, res: express.Response, next: express.NextFunction): Promise<any> {
            const hash = req.param("hash");
            const plain = req.param("plain");

            const sw = new Stopwatch();
            const match = await argon2.verify(hash, plain);
            const verifyTiming = sw.stop();

            res.json({match, timing: {verify: verifyTiming}});
        }
    }
}

export = Route;