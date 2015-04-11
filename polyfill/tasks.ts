/// <reference path="../_definitions.d.ts" />

//#region Tasks Queue

var len = 0,
    queue = new Array(1000),
    undef;

function flush() {
    for (var i = 0; i < len; i += 2) {
        var callback = queue[i],
            args = queue[i + 1];

        callback.apply(null, args);

        queue[i] = undef;
        queue[i + 1] = undef;
    }

    len = 0;
}

//#endregion

//#region Implementation Tests

var scheduleFlush = (function () {
    // Node.JS
    if (typeof process !== "undefined" && {}.toString.call(process) === "[object process]") {
        if (global.setImmediate) {
            return function () {
                global.setImmediate(flush);
            };
        }
        else {
            return function () {
                process.nextTick(flush);
            };
        }
    }
    // Web Workers
    else if (typeof Uint8ClampedArray !== "undefined" && typeof importScripts !== "undefined" && typeof MessageChannel !== "undefined") {
        var channel = new MessageChannel();
        channel.port1.onmessage = flush;

        return function () {
            channel.port2.postMessage(0);
        };
    }
    // Browser
    else {
        var win: any = (typeof window !== "undefined") ? window : {},
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
                observer = new win.MutationObserver(flush),
                node: any = document.createTextNode("");

            observer.observe(node, { characterData: true });

            return function () {
                node.data = (iterations = ++iterations % 2);
            };
        }
        // Post Message
        else if (canUsePostMessage()) {
            var messagePrefix = "setImmediate$" + Math.random() + "$",

                onGlobalMessage = function (event) {
                    if (event.source === win &&
                        typeof event.data === "string" &&
                        event.data.indexOf(messagePrefix) === 0) {
                        flush();
                    }
                };

            if (win.addEventListener) {
                win.addEventListener("message", onGlobalMessage, false);
            } else {
                win.attachEvent("onmessage", onGlobalMessage);
            }

            return function () {
                win.postMessage(messagePrefix + Math.random() * 1000, "*");
            };
        }
        // Set timeout
        else {
            return function () {
                setTimeout(flush, 1);
            };
        }
    }
} ());

//#endregion

//#region Public Methods

export function clear() {
    for (var i = 0; i < len; i++) {
        queue[i] = undef;
    }

    len = 0;
}

export function enqueue(callback: Function, args: any[]) {
    queue[len] = callback;
    queue[len + 1] = args;
    len += 2;

    if (len === 2) {
        // If len is 1, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        scheduleFlush();
    }
}

//#endregion
