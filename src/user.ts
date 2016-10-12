"use strict";

export const HASH_MODE_ALL = "all";
export const HASH_MODE_DEFAULT = "default";

export interface User {
    hashMode: string;
    apiKey: string;
}

export interface UserProvider {
    getUser(apiKey: string): Promise<User>;
}