(function (root, factory) {
    if (typeof exports === "object") {
        // CommonJS
        module.exports = factory(typeof global !== "undefined" ? global : root);
    } else if (typeof define === "function" && define.amd) {
        // AMD
        define(function () { return factory(root); });
    } else {
        // Global Variables
        factory(root);
    }
}(this, function (root) {
/*****************************CONTENT*****************************/

return root.Promise;
}));
