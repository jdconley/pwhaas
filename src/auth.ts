"use strict";

import * as express from "express";
import Middleware from "./middleware";
import * as logging from "./logging";
import { UserProvider } from "./user";

export class Basic extends Middleware {
    public async execute(req: express.Request, res: express.Response, next: express.NextFunction): Promise<any> {
        const failAuth = (code?: number) => {
            res.statusCode = code || 401;
            res.end();
            return false;
        };

        // Has authorization header?
        const authorization = req.header("authorization");
        if (!authorization) {
            this.logger.debug("No authorization header. Sending authenticate challenge to client.", req.headers);
            res.setHeader("WWW-Authenticate", "Basic realm=\"setTimeout API\"");
            return failAuth();
        }

        // Proper authorization header?
        const parts = authorization.split(" ");
        if (parts.length < 2) {
            this.logger.debug("Invalid authorization header '%s'. Sending bad request.", authorization);
            return failAuth(400);
        }

        // Only support Basic auth
        const scheme = parts[0];
        if (!/Basic/i.test(scheme)) {
            this.logger.debug("Authorization scheme '%s' is not supported. Sending bad request. We only support 'Basic' auth.", scheme);
            return failAuth(400);
        }

        const decodedAuth = new Buffer(parts[1], "base64").toString();
        const separatorIndex = decodedAuth.indexOf(":");

        if (separatorIndex < 0) {
            this.logger.debug("Invalid authorization data '%s'. Sending bad request.", decodedAuth);
            return failAuth(400);
        }

        const userid = decodedAuth.substr(0, separatorIndex);
        try {
            const user = await this.userProvider.getUser(userid);
            // User not found. Auth failed.
            if (!user) {
                this.logger.debug("Invalid Api Key '%s' received. Authentication failed.", userid);
                res.setHeader("WWW-Authenticate", "Basic realm=\"pwhaas API\"");
                return failAuth(401);
            }

            // Slap the user on the request so the pipeline can do authorization
            (req as any).user = user;
            this.logger.debug("Api Key '%s' is making a request.", userid, user);

            next();
        } catch (err) {
            this.logger.error("Error authenticating user with id '%s'", userid, err);
            next(err);
        }

        return false;
    }

    private logger = logging.getLogger("auth");

    constructor(private userProvider: UserProvider, options?: any) {
        super(options);
    }
}