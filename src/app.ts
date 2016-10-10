"use strict";

import * as bodyParser from "body-parser";
import * as express from "express";
import * as path from "path";

import * as indexRoute from "./routes/index";
import { Bench } from "./bench";
import { ConfigUserProvider } from "./user";
import { Basic } from "./auth";
import * as config from "config";

/**
 * The server.
 *
 * @class Server
 */
export class Server {

    app: express.Application;
    bench: Bench;
    private toobusy: any = require("toobusy-js");

    /**
     * Bootstrap the application.
     *
     * @class Server
     * @method bootstrap
     * @static
     */
    public static bootstrap(): Server {
        return new Server();
    }

    public shutdown(): void {
        if (this.toobusy) {
            this.toobusy.shutdown();
        }
    }

    /**
     * Constructor.
     *
     * @class Server
     * @constructor
     */
    constructor() {
        //create expressjs application
        this.app = express();

        //bench tool
        this.bench = new Bench();

        //configure application
        this.config();

        //configure routes
        this.routes();
    }

    public init(): Promise<any> {
        return this.bench.init(config.get("bench"));
    }

    private static nocache = (req: express.Request, res: express.Response, next: express.NextFunction): any => {
        res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
        res.setHeader("Expires", "-1");
        res.setHeader("Pragma", "no-cache");
        return next();
    };

    /**
     * Configure application
     *
     * @class Server
     * @method config
     * @return void
     */
    private config() {
        //configure pug
        this.app.set("views", path.join(__dirname, "../views"));
        this.app.set("view engine", "pug");

        //mount logger
        //this.app.use(logger("dev"));

        //mount json form parser
        this.app.use(bodyParser.json());

        //mount query string parser
        this.app.use(bodyParser.urlencoded({ extended: true }));

        //add static paths
        this.app.use(express.static(path.join(__dirname, "public")));

        // middleware which blocks requests when we're too busy 
        let toobusy = require("toobusy-js");

        this.app.use(function(req: express.Request, res: express.Response, next: express.NextFunction) {
            if (toobusy()) {
                //TODO: json response if json in request
                res.send(503, "I'm busy right now, sorry.");
            } else {
                next();
            }
        });

        // catch 404 and forward to error handler
        this.app.use(function (err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
            var error = new Error("Not Found");
            err.status = 404;
            next(err);
        });
    }

    private routes() {
        const router: express.Router = express.Router();

        //home page
        const index: indexRoute.Index = new indexRoute.Index(
            config.get("defaults"), this.bench);
        router.get("/", index.index.bind(index.index));

        //api endpoints
        const auth = new Basic(new ConfigUserProvider());
        router.post("/hash", Server.nocache, auth.execute.bind(auth), index.hash.bind(index));
        router.post("/verify", Server.nocache, auth.execute.bind(auth), index.verify.bind(index));

        this.app.use(router);
    }
}

export const server = Server.bootstrap();