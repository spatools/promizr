/// <reference path="../_definitions.d.ts" />

export var nextTick: (cb: Function) => void = (function () {
    // Node.JS
    if (typeof process !== "undefined" && {}.toString.call(process) === "[object process]") {
        if (global.setImmediate) {
            return function (cb) {
                global.setImmediate(cb);
            };
        }
        else {
            return function (cb) {
                process.nextTick(cb);
            };
        }
    }
    // Web Workers
    else if (typeof Uint8ClampedArray !== "undefined" && typeof importScripts !== "undefined" && typeof MessageChannel !== "undefined") {
        var channel = new MessageChannel();

        return function (cb) {
            channel.port1.onmessage = cb;
            channel.port2.postMessage(0);
        };
    }
    // Browser
    else {
        var win: any = (typeof window !== "undefined") ? window : {},
            tempCallback: Function,
            canUsePostMessage = function canUsePostMessage() {
                // The test against `importScripts` prevents this implementation from being installed inside a web worker,
                // where `global.postMessage` means something completely different and can"t be used for this purpose.
                if (win.postMessage && !win.importScripts) {
                    var postMessageIsAsynchronous = true,
                        oldOnMessage = win.onmessage;

                    win.onmessage = function () {
                        postMessageIsAsynchronous = false;
                    };

                    win.postMessage("", "*");
                    win.onmessage = oldOnMessage;

                    return postMessageIsAsynchronous;
                }
            };

        // Mutation Observer
        if (win.MutationObserver || win.WebKitMutationObserver) {
            win.MutationObserver = win.MutationObserver || win.WebKitMutationObserver;

            var iterations = 0,
                node: any = document.createTextNode(""),
                observer = new win.MutationObserver(() => {
                    tempCallback && tempCallback();
                    tempCallback = null;
                });

            observer.observe(node, { characterData: true });

            return function (cb) {
                tempCallback = cb;
                node.data = (iterations = ++iterations % 2);
            };
        }
        // Post Message
        else if (canUsePostMessage()) {
            var messagePrefix = "setImmediate$" + Math.random() + "$",
                onGlobalMessage = function (event) {
                    if (event.source === win &&
                        typeof event.data === "string" &&
                        event.data.indexOf(messagePrefix) === 0 &&
                        tempCallback) {

                        tempCallback();
                        tempCallback = null;
                    }
                };

            if (win.addEventListener) {
                win.addEventListener("message", onGlobalMessage, false);
            } else {
                win.attachEvent("onmessage", onGlobalMessage);
            }

            return function (cb) {
                tempCallback = cb;
                win.postMessage(messagePrefix + Math.random() * 1000, "*");
            };
        }
        // Set timeout
        else {
            return function (cb) {
                setTimeout(cb, 1);
            };
        }
    }
} ());
