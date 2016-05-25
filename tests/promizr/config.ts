﻿/// <reference path="tests.d.ts" />

requirejs.config({
    //baseUrl: "../",

    paths: {
        "promise": "../../dist/polyfill",
        "promizr": "../../dist/promizr",
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
    "collections",
    "flow",
    //"nextTick",
    "ProgressPromise",
    "queue",
    //"utils"
];

require(tests, function () {
    mocha.run();
});
