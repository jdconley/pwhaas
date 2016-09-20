
"use strict";

import * as express from "express";
import * as argon2 from "argon2";
import * as timing from "../timing";

module Route {
    export class Index {
        public index(req: express.Request, res: express.Response, next: express.NextFunction) {
            res.render("index");
        }

        public hash(req: express.Request, res: express.Response, next: express.NextFunction) {
            //TODO: precondition checking
            //TODO: error handling
            //TODO: options support
            //TODO: timings / rate limits
            
            const options = argon2.defaults;
            const plain = req.param("plain");

            argon2.generateSalt(32).then(salt => {
                argon2.hash(plain, salt, options).then(hash => {
                    res.json({hash, options, timing: new timing.Timing()});
                });
            });
        }

        public verify(req: express.Request, res: express.Response, next: express.NextFunction) {
            //TODO: precondition checking
            //TODO: error handling
            //TODO: timings / rate limits

            const hash = req.param("hash");
            const plain = req.param("plain");

            argon2.verify(hash, plain).then(match => {
                res.json({match, timing: new timing.Timing()});
            });
        }
    }
}

export = Route;