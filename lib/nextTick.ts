type NextTickCallback = () => void;

/**
 * Use the best next tick function depending on platform.
 * @param cb - The callback to call on next tick
 */
const nextTick = (function (self: any): (cb: NextTickCallback) => void {
    // Node.JS
    if (typeof self.process !== "undefined" && Object.prototype.toString.call(self.process) === "[object process]") {
        if (global.setImmediate) {
            return (cb) => {
                global.setImmediate(cb);
            };
        }
        else {
            return (cb) => {
                process.nextTick(cb);
            };
        }
    }
    // Web Workers
    else if (typeof self.Uint8ClampedArray !== "undefined" && typeof self.importScripts !== "undefined" && typeof self.MessageChannel !== "undefined") {
        const channel = new self.MessageChannel();

        return (cb) => {
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
            return (cb) => {
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

            return (cb: NextTickCallback) => {
                tempCallbacks.push(cb);
                win.postMessage(messagePrefix + Math.random() * 1000, "*");
            };
        }
        // Set timeout
        else {
            return (cb) => {
                setTimeout(cb, 1);
            };
        }
    }
})(getGlobal());

export default nextTick;

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

/* eslint-disable @typescript-eslint/ban-ts-comment */
function getGlobal(): any {
    //@ts-ignore
    if (typeof self !== "undefined") { return self; }
    //@ts-ignore
    if (typeof window !== "undefined") { return window; }
    //@ts-ignore
    if (typeof global !== "undefined") { return global; }

    throw new Error("unable to locate global object");
}
