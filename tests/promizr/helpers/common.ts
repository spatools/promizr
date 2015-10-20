/// <reference path="../tests.d.ts" />

import promizr = require("promizr");

if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
        if (typeof this !== "function") {
            // closest thing possible to the ECMAScript 5 internal IsCallable function
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }

        var args = Array.prototype.slice.call(arguments, 1),
            toBind = this,
            Noop = function () { return; },
            bound = function () {
                return toBind.apply(
                    this instanceof Noop && oThis ? this : oThis,
                    args.concat(Array.prototype.slice.call(arguments))
                );
            };

        Noop.prototype = this.prototype;
        bound.prototype = new Noop();

        return bound;
    };
}

export var testError = new Error("test");

export function isUndefined(x: any): boolean {
    return typeof x === "undefined";
}

export function noop(): () => void {
    return function () { return; };
}

export function identity<T>(val: T): T {
    return val;
}

export function createPromise<T>(): Promise<T> {
    return new Promise(noop);
}

export function createDeferreds<T>(list: T[]): PromiseCapability<void>[] {
    return list.map(() => {
        const dfd = promizr.defer<any>();
        dfd.promise = dfd.promise.then(promizr.timeout);

        return dfd;
    });
}

export function cleanSpy(spy: SinonSpy) {
    if (spy) {
        if (spy.restore) {
            spy.restore();
        }

        spy.reset();
    }
}

export type StringOrNumber = string | number;

export function createExecutorObject<T extends StringOrNumber, U>(list: T[], mapper: (key: T) => () => Promise<U>): promizr.PromiseTaskExecutorObject<U> {
    var result: promizr.PromiseTaskExecutorObject<U> = {};

    list.forEach(val => {
        result[val.toString()] = mapper(val);
    });

    return result;
}
