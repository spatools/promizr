/// <reference path="../tests.d.ts" />

import Promise = require("polyfill/class");
import abstract = require("polyfill/abstract");
import commonHelpers = require("./common");

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
