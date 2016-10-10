"use strict";

import * as winston  from "winston";
import * as config  from "config";

const winstonConf = require("winston-config");
let initialized = false;

export function getLogger(category: string): winston.LoggerInstance {
    if (!initialized) {
        winstonConf.fromJson(config.get("log"), c => { console.log("Winston Configured"); });
        initialized = true;
    }

    return winston.loggers.get(category);
}