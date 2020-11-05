export type NextTickCallback = () => void;

export const nextTick: (cb: NextTickCallback) => void = (function (self: any) {
    // Node.JS
    if (typeof self.process !== "undefined" && {}.toString.call(self.process) === "[object process]") {
        if (global.setImmediate) {
            return (cb: NextTickCallback) => {
                global.setImmediate(cb);
            };
        }
        else {
            return (cb: NextTickCallback) => {
                process.nextTick(cb);
            };
        }
    }
    // Web Workers
    else if (typeof self.Uint8ClampedArray !== "undefined" && typeof self.importScripts !== "undefined" && typeof self.MessageChannel !== "undefined") {
        const channel = new self.MessageChannel();

        return (cb: NextTickCallback) => {
            channel.port1.onmessage = cb;
            channel.port2.postMessage(0);
        };
    }
    // Browser
    else {
        const win = self.window;
        const tempCallbacks: NextTickCallback[] = [];

        // Mutation Observer
        if (win.MutationObserver || win.WebKitMutationObserver) {
            const MutationObserver = win.MutationObserver || win.WebKitMutationObserver;

            const observer = new MutationObserver(() => {
                let cb: NextTickCallback | undefined;
                while ((cb = tempCallbacks.shift()) || tempCallbacks.length) {
                    if (cb) cb();
                }
            });

            const node = self.document.createTextNode("");
            observer.observe(node, { characterData: true });

            let iterations = 0;
            return (cb: NextTickCallback) => {
                tempCallbacks.push(cb);
                node.data = (iterations = ++iterations % 2);
            };
        }
        // Post Message
        else if (canUsePostMessage(win)) {
            const messagePrefix = "setImmediate$" + Math.random() + "$";
            const onGlobalMessage = createGlobalMessageHandler(win, tempCallbacks, messagePrefix);

            if (win.addEventListener) {
                win.addEventListener("message", onGlobalMessage, false);
            } else {
                win.attachEvent("onmessage", onGlobalMessage);
            }

            return function (cb: NextTickCallback) {
                tempCallbacks.push(cb);
                win.postMessage(messagePrefix + Math.random() * 1000, "*");
            };
        }
        // Set timeout
        else {
            return (cb: NextTickCallback) => {
                setTimeout(cb, 1);
            };
        }
    }

    function createGlobalMessageHandler(win: any, tempCallbacks: NextTickCallback[], messagePrefix: string): (event: any) => void {
        return (event: any) => {
            if (event.source === win && typeof event.data === "string" && event.data.indexOf(messagePrefix) === 0) {
                let cb: NextTickCallback | undefined;
                while ((cb = tempCallbacks.shift()) || tempCallbacks.length) {
                    if (cb) cb();
                }
            }
        };
    }

    function canUsePostMessage(win: any): boolean {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can"t be used for this purpose.
        if (win.postMessage && !win.importScripts) {
            const oldOnMessage = win.onmessage;

            let postMessageIsAsynchronous = true;

            win.onmessage = () => { postMessageIsAsynchronous = false; };
            win.postMessage("", "*");

            win.onmessage = oldOnMessage;

            return postMessageIsAsynchronous;
        }

        return false;
    }
})(this);
