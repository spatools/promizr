/// <reference path="promise.d.ts" />
/// <reference path="../_definitions.d.ts" />

(function (root, factory) {
    if (typeof exports === "object") {
        // CommonJS
        module.exports = factory(typeof global !== "undefined" ? global : root);
    } else if (typeof define === "function" && define.amd) {
        // AMD
        define(() => factory(root));
    } else {
        // Global Variables
        factory(root);
    }
} (this, function (root) {
    /****************************************************************/
    /****************************************************************/
    /****************************************************************/

    (function () {
        var P: typeof Promise = root.Promise;

        function isWellImplemented() {
            var resolve: (val: any) => void;
            new P(r => { resolve = r; });
            return (typeof resolve === "function");
        }

        function hasPromise() {
            return P &&
                // Some of these methods are missing from Firefox/Chrome experimental implementations
                "resolve" in P && "reject" in P &&
                "all" in P && "race" in P &&
                // Older version of the spec had a resolver object as the arg rather than a function
                isWellImplemented();
        }

        if (!hasPromise()) {
            root.Promise = require("./class");
        }

        return root.Promise;
    })();
}));
