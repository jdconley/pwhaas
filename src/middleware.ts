"use strict";

import * as express from "express";

export default class Middleware {
    public execute(req: express.Request, res: express.Response, next: express.NextFunction) {
        return next();
    }
    options: any;

    constructor(options: any) {
        this.options = options;
    }
}