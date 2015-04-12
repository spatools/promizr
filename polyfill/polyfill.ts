/// <reference path="../_definitions.d.ts" />

function isWellImplemented(P) {
    var resolve;
    new P(function (r) { resolve = r; });
    return (typeof resolve === "function");
}

function hasPromise(P) {
    return P &&
        // Some of these methods are missing from Firefox/Chrome experimental implementations
        "resolve" in P && "reject" in P &&
        "all" in P && "race" in P &&
        // Older version of the spec had a resolver object as the arg rather than a function
        isWellImplemented(P);
}

if (!hasPromise(root.Promise)) {
    root.Promise = require("./class");
}
