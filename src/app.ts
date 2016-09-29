"use strict";

import * as bodyParser from "body-parser";
import * as express from "express";
import * as path from "path";

import * as indexRoute from "./routes/index";

/**
 * The server.
 *
 * @class Server
 */
class Server {

  public app: express.Application;
  private toobusy:any = require('toobusy-js');

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

  public shutdown():void {
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

    //configure application
    this.config();

    //configure routes
    this.routes();
  }

  /**
   * Configure application
   *
   * @class Server
   * @method config
   * @return void
   */
  private config() {
    //configure pug
    //HACK: this assumes we are transpiling to a subdirectory one level up (it should just be configurable)
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
    this.app.use(express.static(path.join(__dirname, "bower_components")));

    // middleware which blocks requests when we're too busy 
    let toobusy = require('toobusy-js');

    this.app.use(function(req, res, next) {
        if (toobusy()) {
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

  /**
   * Configure routes
   *
   * @class Server
   * @method routes
   * @return void
   */
  private routes() {
    //get router
    let router: express.Router;
    router = express.Router();

    //create routes
    var index: indexRoute.Index = new indexRoute.Index();

    //home page
    router.get("/", index.index.bind(index.index));

    //use router middleware
    this.app.use(router);
  }
}

var server = Server.bootstrap();
export = server;