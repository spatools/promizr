/// <reference path="../tests.d.ts" />

import * as sinon from "sinon";
import * as abstract from "polyfill/abstract";
import * as commonHelpers from "./common";
import Promise = require("polyfill/class");

export function createFakeReaction(): PromiseReaction {
    return {
        capability: abstract.newPromiseCapability(Promise),
        handler: sinon.spy()
    };
}

export function createFakeReactionNoSpy(): PromiseReaction {
    return {
        capability: abstract.newPromiseCapability(Promise),
        handler: commonHelpers.noop()
    };
}

export function createFakeReactions(count: number): PromiseReaction[] {
    var result = [],
        i = 0;

    for (; i < count; i++) {
        result[i] = createFakeReaction();
    }

    return result;
}
