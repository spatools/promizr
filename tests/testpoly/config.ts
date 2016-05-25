/// <reference path="tests.d.ts" />

requirejs.config({
    //baseUrl: "../",

    paths: {
        "polyfill": "../../polyfill",
        "promise": "../../dist/polyfill",
        "mocha": "../../bower_components/mocha/mocha",
        "should": "../../bower_components/should/should",
        "sinon": "../../bower_components/sinon/index"
    },

    shim: {
        mocha: {
            exports: "mocha"
        }
    }
});

(<any>window).root = window;

(<any>window).console = window.console || function () { return; };
(<any>window).notrack = true;

var tests = [
    "abstract",
    "build",
    "tasks",
    "constructor",
    "prototype",
    "static"
];

require(tests, function () {
    mocha.run();
});
