/// <reference path="../tests.d.ts" />

import * as abstract from "polyfill/abstract";
import Promise = require("polyfill/class");

export function createFakeCapability(): PromiseCapability<any> {
    return abstract.newPromiseCapability(Promise);
}

export function createFakeCapabilities(count: number): PromiseCapability<any>[] {
    var result = [],
        i = 0;

    for (; i < count; i++) {
        result[i] = createFakeCapability();
    }

    return result;
}

export function extractPromisesFromCapabilities(capabilities: PromiseCapability<any>[]): Promise<any>[] {
    var result = [],
        len = capabilities.length,
        i = 0;

    for (; i < len; i++) {
        result[i] = capabilities[i].promise;
    }

    return result;
}
