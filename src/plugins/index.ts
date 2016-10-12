"use strict";

import * as config from "config";
import * as logging from "../logging";

const logger = logging.getLogger("plugins");

interface PwhaasPluginConfig {
    name: string;
    module: string;
    class?: string;
    options?: any;
}

export interface DependencyResolver {
    getDependency<T>(name: string): T;
}

export interface PwhaasPlugin {
    init(options: any): Promise<any>;
    resolveDependencies(ioc: DependencyResolver): void;
}

function createPlugin(config: PwhaasPluginConfig): PwhaasPlugin {
    let moduleInstance: any;

    try {
        logger.info(`Creating module: "${config.module}".`);
        moduleInstance = require(config.module);
    } catch (err) {
        logger.error(`Unable to create module: "${config.module}".`, err);
        return null;
    }

    let classInstance: PwhaasPlugin;

    if (config.class) {
        try {
            logger.info(`Creating class: "${config.class}". Module "${config.module}".`);
            classInstance = new moduleInstance[config.class]();
        } catch (err) {
            logger.error(`Unable to create object from class: "${config.class}". Module "${config.module}".`, err);
            return null;
        }
    } else {
        logger.info(`No class found in configuration. Using module directly: "${config.module}".`);
        classInstance = moduleInstance;
    }

    return classInstance;
}

const plugins: {[name: string]: PwhaasPlugin} = {};

export function getPlugin<TPlugin>(name: string): TPlugin {
    let pluginInstance: PwhaasPlugin = plugins[name];

    if (!pluginInstance) {
        logger.error(`Plugin not available: "${name}". Make sure it is in your configuration file.`);
        return null;
    }

    return (pluginInstance as any);
}

export async function init<T>(ioc: DependencyResolver): Promise<any> {
    const allPluginConfigs = config.get<PwhaasPluginConfig[]>("plugins");

    // In the order of the configs listed in the file:
    //  - Create plugins
    //  - Resolve dependencies
    //  - Initialize plugins

    for (let i = 0; i < allPluginConfigs.length; i++) {
        const pConfig = allPluginConfigs[i];
        plugins[pConfig.name] = createPlugin(pConfig);
        if (!plugins[pConfig.name]) {
            logger.error(`Unable to load plugin: "${name}". Couldn't create instance.`);
            return null;
        }
    }

    for (let i = 0; i < allPluginConfigs.length; i++) {
        const pConfig = allPluginConfigs[i];
        try {
            logger.info(`Resolving dependencies for plugin: "${pConfig.name}".`);
            plugins[pConfig.name].resolveDependencies(ioc);
        } catch (err) {
            logger.error(`Unable to resolve dependencies for plugin: "${pConfig.name}".`, err);
        }
    }

    for (let i = 0; i < allPluginConfigs.length; i++) {
        const pConfig = allPluginConfigs[i];
        try {
            logger.info(`Initializing plugin: "${pConfig.name}".`);
        await plugins[pConfig.name].init(pConfig.options);
        } catch (err) {
            logger.error(`Unable to initialize plugin: "${pConfig.name}".`, err);
        }
    }
}
