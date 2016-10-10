import * as winston  from "winston";
import * as config  from "config";

// Just export a couple factory methods for easy consumption.
// This is to wrap up our category-based configuration.

function getLoggerConfig(category: string): winston.LoggerOptions {
    if (config.has("log." + category)) {
        return config.get("log." + category);
    } else if (config.has("log.default")) {
        return config.get("log.default");
    }
    return null;
}

export function getLogger(category: string): winston.LoggerInstance {
    return winston.loggers.get(category, getLoggerConfig(category));
}

export function getRequestLoggerConfig(category: string): winston.LoggerOptions {
    var logConfig = getLoggerConfig(category);
    logConfig = logConfig || { transports: [] };
    return logConfig;
}