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

export function isWellImplemented(P) {
    var resolve;
    new P(function (r) { resolve = r; });
    return (typeof resolve === "function");
}

export function isPromise(P) {
    return P &&
        // Some of these methods are missing from Firefox/Chrome experimental implementations
        "resolve" in P && "reject" in P &&
        "all" in P && "race" in P &&
        // Older version of the spec had a resolver object as the arg rather than a function
        isWellImplemented(P);
}
