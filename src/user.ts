"use strict";

import * as config from "config";
import * as _ from "lodash";

export const HASH_MODE_ALL = "all";
export const HASH_MODE_DEFAULT = "default";

export interface User {
    hashMode: string;
    apiKey: string;
}

export interface UserProvider {
    init(): Promise<any>;
    getUser(apiKey: string): Promise<User>;
}

export class ConfigUserProvider implements UserProvider {
    private usersByApiKey: _.Dictionary<User>;

    init(): Promise<any> {
        const auth: any = config.get("auth");
        const users: Array<User> = auth.users;

        this.usersByApiKey = _.keyBy(users, "apiKey");

        return Promise.resolve();
    }

    getUser(apiKey: string): Promise<User> {
        return Promise.resolve(this.usersByApiKey[apiKey]);
    }
}