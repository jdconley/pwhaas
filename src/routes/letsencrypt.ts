"use strict";

import * as express from "express";

export function token(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (process.env.LETSENCRYPT_TOKEN &&
        req.params.challenge === process.env.LETSENCRYPT_CHALLENGE) {

        res.type("text/plain");
        res.send(process.env.LETSENCRYPT_TOKEN);

    } else {
        next();
    }
}