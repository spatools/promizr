/* istanbul ignore file */

export type Handle = number;

type Task = { c: (...args: any) => void, a: any; };
type PlatformImplementation = (handle: Handle) => void;

let _setImmediate: <T extends readonly unknown[]>(callback: (...args: T) => void, ...args: T) => Handle;
let _clearImmediate: (handle: Handle) => void;

(function (global: any): void {
    if (global.setImmediate && global.clearImmediate) {
        _setImmediate = global.setImmediate;
        _clearImmediate = global.clearImmediate;
        return;
    }

    const doc = global.document;
    const tasks: Record<Handle, Task> = {};
    let nextHandle = 1; // Spec says greater than zero
    let running = false;

    const platformImplementation = getPlatformImplementation();

    _setImmediate = <T extends readonly unknown[]>(callback: (...args: T) => void, ...args: T): Handle => {
        // Callback can either be a function or a string
        if (typeof callback !== "function") {
            callback = new Function("" + callback) as typeof callback;
        }

        // Store and register the task
        tasks[nextHandle] = { c: callback, a: args };

        platformImplementation(nextHandle);

        return nextHandle++;
    }

    _clearImmediate = (handle: Handle): void => {
        delete tasks[handle];
    }

    function getPlatformImplementation(): PlatformImplementation {
        // Don't get fooled by e.g. browserify environments.
        if ({}.toString.call(global.process) === "[object process]") {
            // For Node.js before 0.9
            return nextTickImplementation();
        }
        else if (canUsePostMessage()) {
            // For non-IE10 modern browsers
            return postMessageImplementation();
        }
        else if (global.MessageChannel) {
            // For web workers, where supported
            return messageChannelImplementation();
        }
        else if (doc && "onreadystatechange" in doc.createElement("script")) {
            // For IE 6–8
            return readyStateChangeImplementation();
        }
        else {
            // For older browsers
            return setTimeoutImplementation();
        }
    }

    function nextTickImplementation(): PlatformImplementation {
        return (handle) => {
            process.nextTick(() => { runIfPresent(handle); });
        };
    }

    function canUsePostMessage(): boolean | undefined {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            let postMessageIsAsynchronous = true;
            const onmessage = (): void => {
                postMessageIsAsynchronous = false;

                if (global.removeEventListener) global.removeEventListener("message", onmessage, false);
                else global.detachEvent("onmessage", onmessage);
            };

            if (global.addEventListener) global.addEventListener("message", onmessage, false);
            else global.attachEvent("onmessage", onmessage);

            global.postMessage("", "*");

            return postMessageIsAsynchronous;
        }
    }

    function postMessageImplementation(): PlatformImplementation {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        const messagePrefix = "setImmediate$" + Math.random() + "$";

        if (global.addEventListener) global.addEventListener("message", onGlobalMessage, false);
        else global.attachEvent("onmessage", onGlobalMessage);

        return (handle) => {
            global.postMessage(messagePrefix + handle, "*");
        };

        function onGlobalMessage(event: any): void {
            if (event.source === global && typeof event.data === "string" && startsWith(event.data, messagePrefix)) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        }
    }

    function messageChannelImplementation(): PlatformImplementation {
        const channel = new global.MessageChannel();
        channel.port1.onmessage = (event: any) => { runIfPresent(event.data); };
        return (handle) => {
            channel.port2.postMessage(handle);
        };
    }

    function readyStateChangeImplementation(): PlatformImplementation {
        const html = doc.documentElement;
        return (handle) => {
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            let script = doc.createElement("script");
            script.onreadystatechange = () => {
                runIfPresent(handle);
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
            };
            html.appendChild(script);
        };
    }

    function setTimeoutImplementation(): PlatformImplementation {
        return (handle) => {
            setTimeout(runIfPresent, 0, handle);
        };
    }

    function runIfPresent(handle: Handle): void {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (running) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(runIfPresent, 0, handle);
        } else {
            const task = tasks[handle];
            if (task) {
                running = true;
                try {
                    const { c, a } = task;
                    c(...a);
                } finally {
                    _clearImmediate(handle);
                    running = false;
                }
            }
        }
    }

    function startsWith(str: string, value: string): boolean {
        const len = value.length;
        for (let i = 0; i < len; i++) {
            if (str[i] !== value[i]) {
                return false;
            }
        }

        return true;
    }
    /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
    //@ts-ignore
}(typeof self === "undefined" ? typeof global === "undefined" ? this : global : self));

/**
 * @public
 * 
 * Use the best setImmediate equivalent function depending on platform.
 * 
 * @param callback - The callback to call at the end of the event loop.
 * @param args - Arguments to apply to callback.
 */
export const setImmediate = _setImmediate;

/**
 * @public
 * 
 * Abort a previously {@see setImmediate} callback.
 * 
 * @param handle - The handle retrieved by setImmediate. 
 */
export const clearImmediate = _clearImmediate;
