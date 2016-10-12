"use strict";

import * as bodyParser from "body-parser";
import * as express from "express";
import * as path from "path";

import * as indexRoute from "./routes/index";
import { Bench } from "./bench";
import { Middleware } from "./middleware";
import * as config from "config";
import * as Logger from "./logging";
import * as favicon from "serve-favicon";
import * as letsencrypt from "./routes/letsencrypt";

import * as plugins from "./plugins/index";

const expressWinston: any = require("express-winston");

export class Server implements plugins.DependencyResolver {
    getDependency<T>(name: string): T {
        const plugin = plugins.getPlugin<T>(name);
        if (plugin) {
            return plugin;
        }

        // Expose some well-known things that aren't in the plugin system
        if (name === "server") {
            return this as any;
        }

        if (name === "bench") {
            return this.bench as any;
        }

        if (name === "plugins") {
            return plugins as any;
        }

        return null;
    }

    app: express.Application;
    bench: Bench;
    private toobusy: any = require("toobusy-js");
    private initialized: boolean = false;

    public static bootstrap(): Server {
        return new Server();
    }

    public shutdown(): void {
        if (this.toobusy) {
            this.toobusy.shutdown();
        }
    }

    constructor() {
        this.app = express();
        this.bench = new Bench();
    }

    public async init(): Promise<any> {
        // Load plugins before config and routes.
        await plugins.init(this);

        // Config and routes may use certain types of plugins. 
        this.config();
        this.routes();

        await this.bench.init(config.get("bench"));

        this.initialized = true;
    }

    private static nocache = (req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.setHeader("Cache-Control", "private, max-age=0, no-cache, no-store, must-revalidate");
        res.setHeader("Expires", "-1");
        res.setHeader("Pragma", "no-cache");
        next();
    };

    private static shortcache = (req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.setHeader("Cache-Control", "public, max-age=60");
        res.setHeader("Expires", new Date(Date.now() + 60000).toUTCString());
        next();
    };

    private toobusyHandler = (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (this.toobusy()) {
            //TODO: json response if json in request
            res.send(503, "I'm busy right now, sorry.");
        } else {
            next();
        }
    }

    private initializedHandler = (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (this.initialized) {
            next();
        } else {
            res.send(503, "Not yet initialized. Try again in a minute.");
        }
    }

    private config() {
        this.app.set("views", path.join(__dirname, "../views"));
        this.app.set("view engine", "pug");

        this.app.use(expressWinston.logger({
            winstonInstance: Logger.getLogger("request")
        }));

        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(express.static(path.join(__dirname, "public")));
        this.app.use(favicon(path.join(__dirname, "../public/favicon.ico")));

        this.app.use(expressWinston.errorLogger({
            winstonInstance: Logger.getLogger("requestError"),
            level: "error"
        }));

        // development error handler
        // will print stacktrace
        if (this.app.get("env") === "development") {
            this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
                res.status(err.status || 500);
                // TODO: JSON response if requested in request
                res.render("error", {
                    message: err.message,
                    stack: JSON.stringify(err)
                });
            });
        } else {
            // production error handler
            // no stacktraces leaked to user
            this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
                res.status(err.status || 500);
                // TODO: JSON response if requested in request
                res.render("error", {
                    message: err.message,
                    stack: JSON.stringify({"stacktrace": "Not available"})
                });
            });
        }
    }

    private routes() {
        const router: express.Router = express.Router();

        //home page
        const index: indexRoute.Index = new indexRoute.Index(config.get("defaults"), this.bench);
        router.get("/", Server.shortcache, index.index.bind(index.index));

        //api endpoints
        const auth = this.getDependency<Middleware>("auth");
        router.post(
            "/hash",
            Server.nocache,
            this.toobusyHandler.bind(this),
            this.initializedHandler.bind(this),
            auth.execute.bind(auth),
            index.hash.bind(index));

        router.post(
            "/verify",
            Server.nocache,
            this.toobusyHandler.bind(this),
            this.initializedHandler.bind(this),
            auth.execute.bind(auth),
            index.verify.bind(index));

        router.get(
            "/timings",
            Server.shortcache,
            this.toobusyHandler.bind(this),
            this.initializedHandler.bind(this),
            index.timings.bind(index));

        router.get(
            "/.well-known/acme-challenge/:challenge",
            Server.nocache,
            letsencrypt.token.bind(letsencrypt));

        this.app.use(router);

        this.app.use(function (req: express.Request, res: express.Response, next: express.NextFunction) {
            res.status(404);

            // TODO: JSON response if requested in request
            res.render("error", {
                message: "Hmmmm, couldn't find that resource.",
                stack: "N/A"
            });
        });
    }
}

export const server = Server.bootstrap();