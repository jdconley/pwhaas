"use strict";

import * as config from "config";
import * as _ from "lodash";
import { User, UserProvider } from "../user";
import { PwhaasPlugin, DependencyResolver } from ".";

interface ConfigUserProviderConfig {
    users: User[];
}

export class ConfigUserProvider implements UserProvider, PwhaasPlugin {
    private usersByApiKey: _.Dictionary<User>;

    init(options: any): Promise<any> {
        const users = (options as ConfigUserProviderConfig).users;

        this.usersByApiKey = _.keyBy(users, "apiKey");

        return Promise.resolve();
    }

    getUser(apiKey: string): Promise<User> {
        return Promise.resolve(this.usersByApiKey[apiKey]);
    }

    resolveDependencies(ioc: DependencyResolver): void {
        // No plugin deps
    }
}