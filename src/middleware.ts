"use strict";

import * as express from "express";

export interface Middleware {
    execute(req: express.Request, res: express.Response, next: express.NextFunction): Promise<any>;
}