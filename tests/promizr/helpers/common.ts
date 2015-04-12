/// <reference path="../tests.d.ts" />

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

export function isUndefined(x: any): boolean {
    return typeof x === "undefined";
}

export function noop(): () => void {
    return function () { return; };
}

export function cleanSpy(spy: SinonSpy) {
    if (spy) {
        if (spy.restore) {
            spy.restore();
        }

        spy.reset();
    }
}
