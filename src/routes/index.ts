
"use strict";

import * as express from "express";
import * as argon2 from "argon2";
import * as timing from "../timing";
import {Stopwatch} from "../stopwatch";

module Route {
    export class Index {
        public index(req: express.Request, res: express.Response, next: express.NextFunction) {
            res.render("index");
        }

        public async hash(req: express.Request, res: express.Response, next: express.NextFunction):Promise<any> {
            //TODO: precondition checking
            //TODO: error handling
            //TODO: options support
            //TODO: queueing based on capacity
            
            const options = argon2.defaults;
            const plain = req.param("plain");
            const maxtime = Number(req.param("maxtime") || 500);

            const sw = new Stopwatch();
            const salt = await argon2.generateSalt(32);
            const saltTiming = sw.reset(true);

            const hash = await argon2.hash(plain, salt, options);
            const hashTiming = sw.stop();

            res.json({hash, options, timing: {salt: saltTiming, hash: hashTiming}});
        }

        public async verify(req: express.Request, res: express.Response, next: express.NextFunction):Promise<any> {
            //TODO: precondition checking
            //TODO: error handling
            //TODO: queueing based on capacity

            const hash = req.param("hash");
            const plain = req.param("plain");

            const sw = new Stopwatch();
            const match = await argon2.verify(hash, plain);
            const hashTiming = sw.stop();
            
            res.json({match, timing: {hash: hashTiming}});
        }
    }
}

export = Route;