(function (root, factory) {
    if (typeof exports === "object") {
        // CommonJS
        factory(exports);
    } else if (typeof define === "function" && define.amd) {
        // AMD
        define(["exports"], factory);
    } else {
        // Global Variables
        factory(root.promizr = root.pzr = {});
    }
}(this, function (exports) {
/*****************************CONTENT*****************************/
}));
