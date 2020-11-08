/**
 * @public
 *
 * Alias for `Promise.resolve`.
 */
const resolve = Promise.resolve.bind(Promise);

/**
 * @public
 *
 * Execute `task` with given arguments by ensuring that the result is a Promise.
 * If task throws synchronously, it's wrapped as a Promise.
 *
 * @param task - The function to call
 * @param args - The arguments to pass to task
 */
function exec(task, ...args) {
    try {
        return resolve(task(...args));
    }
    catch (err) {
        return Promise.reject(err);
    }
}

/**
 * @public
 *
 * Create a new Task which exec `task` with given arguments.
 *
 * @param action - The function to apply
 * @param args - The `task` argument
 *
 * @example
 * ```typescript
 * const action = (value: string, upperCase: boolean) => upperCase ? value.toUpperCase() : value;
 *
 * const task = promizr.apply(action, "value", true);
 *
 * const res = await task();
 * // res === "VALUE"
 * ```
 */
function apply(action, ...args) {
    return () => exec(action, ...args);
}

/**
 * @public
 *
 * Run given tasks in parallel and resolves with an array of the results of each task.
 *
 * @param tasks - The array or object that contains functions to execute in parallel
 */
function parallel(tasks) {
    return Array.isArray(tasks) ?
        listParallel(tasks) :
        objectParallel(tasks);
}
function listParallel(array) {
    const promises = array.map(task => exec(task));
    return Promise.all(promises);
}
function objectParallel(obj) {
    const results = {};
    const promises = [];
    for (const key in obj) {
        if (typeof obj[key] === "function") {
            promises.push(interator(key, obj[key]));
        }
    }
    return Promise.all(promises).then(() => results);
    function interator(key, executor) {
        return exec(executor).then(result => { results[key] = result; });
    }
}

/**
 * @public
 *
 * Prepare a new function which call all `tasks` in parallel with given arguments.
 * Returns an array with the result of all `tasks`.
 *
 * @param tasks - Functions to run
 *
 * @example
 * ```typescript
 * const upper = (value: string) => value.toUpperCase();
 * const lower = (value: string) => value.toLowerCase();
 * const prefix = (value: string) => `prefix-${value}`;
 *
 * const task = promizr.applyEach(action);
 *
 * const res = await task("Value");
 * // res === ["VALUE", "value", "prefix-Value"]
 * ```
 */
function applyEach(tasks) {
    return function (...args) {
        const iterators = tasks.map(e => () => e.apply(this, args));
        return parallel(iterators);
    };
}

/**
 * @public
 *
 * Run given tasks in parallel and resolves with an array of the results of each task.
 *
 * @param tasks - The array or object that contains functions to execute in parallel
 */
function series(tasks) {
    return Array.isArray(tasks) ?
        listSeries(tasks) :
        objectSeries(tasks);
}
function listSeries(array) {
    const results = [];
    const len = array.length;
    let p = resolve();
    for (let i = 0; i < len; i++) {
        p = p.then(createIterator(array[i]));
    }
    return p.then(() => results);
    function createIterator(executor) {
        return () => {
            return resolve(executor()).then(result => { results.push(result); });
        };
    }
}
function objectSeries(obj) {
    const results = {};
    let p = resolve();
    for (const key in obj) {
        if (typeof obj[key] === "function") {
            p = p.then(createIterator(key, obj[key]));
        }
    }
    return p.then(() => results);
    function createIterator(key, executor) {
        return () => {
            return resolve(executor()).then(result => { results[key] = result; });
        };
    }
}

/**
 * @public
 *
 * The same as {@link applyEach}, only `tasks` are applied in series.
 * The next `task` is only called once the current one has completed.
 * This means the `task` functions will complete in order.
 *
 * @param tasks - Functions to run
 *
 * @example
 * ```typescript
 * const upper = (value: string) => value.toUpperCase();
 * const lower = (value: string) => value.toLowerCase();
 * const prefix = (value: string) => `prefix-${value}`;
 *
 * const task = promizr.applyEachSeries(action);
 *
 * const res = await task("Value");
 * // res === ["VALUE", "value", "prefix-Value"]
 * ```
 */
function applyEachSeries(tasks) {
    return function (...args) {
        const iterators = tasks.map(e => () => e.apply(this, args));
        return series(iterators);
    };
}

/**
 * @public
 *
 * Sames as {@link exec} but use `owner` as `this` context when calling `task`.
 *
 * @param owner - The this context
 * @param task - The function to call
 * @param args - The arguments to pass to task
 */
function execOn(owner, task, ...args) {
    try {
        return resolve(task.apply(owner, args));
    }
    catch (err) {
        return Promise.reject(err);
    }
}

function applyOn(owner, taskOrFunction, ...args) {
    const task = typeof taskOrFunction === "string" ? owner[taskOrFunction] : taskOrFunction;
    return () => execOn(owner, task, ...args);
}

function cbpromisify(owner, fn) {
    if (typeof owner === "function" && typeof fn !== "function") {
        fn = owner;
        owner = undefined;
    }
    if (!fn) {
        throw new TypeError("fn should be provided!");
    }
    const executor = fn;
    return (...args) => {
        return new Promise((resolve, reject) => {
            executor.apply(owner, [...args, success, error]);
            function success(...results) {
                if (results.length === 0)
                    return resolve();
                if (results.length === 1)
                    return resolve(results[0]);
                resolve(results);
            }
            function error(...errors) {
                if (errors.length === 1) {
                    return reject(errors[0]);
                }
                reject(errors);
            }
        });
    };
}

/**
 * @public
 *
 * Prepare a new function that transfer its arguments to the last `task` then calls each `task` using the result of the previous `task`.
 * Resolves with the result of the first `task`.
 *
 * Note: Execution order if from end to start.
 *
 * @param tasks - Functions to be run from last to first
 */
function compose(...tasks) {
    return function (...args) {
        let p = resolve();
        const len = tasks.length;
        if (!len)
            return p;
        const last = tasks[len - 1];
        p = p.then(() => last.apply(this, args));
        for (let i = len - 2; i >= 0; i--) {
            p = p.then(tasks[i]);
        }
        return p;
    };
}

/**
 * @public
 *
 * Produces a new array of values by mapping each value in `array` through the `iterator` function.
 * The `iterator` is called with an item from the list, the index of this item and the list itself.
 * If the `iterator` emit a rejected Promise, the each function `Promise` result is instantly rejected.
 *
 * Note, that since this function applies the `iterator` to each item in parallel, there is no guarantee that the `iterator` functions will complete in order.
 * However, the results array will be in the same order as the original `arr`.
 *
 * @param array - The array to iterate on
 * @param iterator - The iterator which map each item
 */
function map(array, iterator) {
    const promises = array.map(mapper);
    return Promise.all(promises);
    function mapper(item, index, list) {
        return exec(iterator, item, index, list);
    }
}

/**
 * @public
 *
 * Applies `iterator` to each item in `array`, concatenating the results.
 * Returns the concatenated list.
 *
 * The `iterator`s are called in parallel, and the results are concatenated as they return.
 * There is no guarantee that the results array will be returned in the original order of `array` passed to the `iterator` function.
 *
 * @param array - The array to iterate on
 * @param iterator - An iterator which returns arrays
 */
function concat(array, iterator) {
    return map(array, iterator)
        .then(results => [].concat(...results.filter(a => !!a)));
}

/**
 * @public
 *
 * The same as {@link each}, only `iterator` is applied to each item in `array` in series.
 * The next `iterator` is only called once the current one has completed.
 * This means the `iterator` functions will complete in order.
 *
 * @param array - The array to iterate on
 * @param iterator - The iterator to apply on each item
 */
function eachSeries(array, iterator) {
    return new Promise((res, reject) => {
        const len = array.length;
        let p = resolve();
        for (let i = 0; i < len; i++) {
            p = p.then(createIterator(array[i], i, array));
        }
        return p.then(() => res(), reject);
        function createIterator(value, index, list) {
            return () => iterator(value, index, list);
        }
    });
}

/**
 * @public
 *
 * The same as {@link map}, only the `iterator` is applied to each item in `array` in series.
 * The next `iterator` is only called once the current one has completed.
 * The results array will be in the same order as the original.
 *
 * @param array - The array to iterate on
 * @param iterator - The iterator which map each item
 */
function mapSeries(array, iterator) {
    const results = [];
    return eachSeries(array, mapper).then(() => results);
    function mapper(item, index, list) {
        return resolve(iterator(item, index, list)).then(result => {
            results[index] = result;
        });
    }
}

/**
 * @public
 *
 * Same as {@link concat}, but executes in series instead of parallel.
 *
 * @param array - The array to iterate on
 * @param iterator - An iterator which returns arrays
 */
function concatSeries(array, iterator) {
    return mapSeries(array, iterator)
        .then(results => [].concat(...results.filter(a => !!a)));
}

/**
 * @public
 *
 * Returns a new Deferred object.
 *
 * A Deferred object is an object containing 3 properties: `resolve`, `reject` and `promise`.
 * The `resolve` function resolves the `promise`.
 * The `reject` function rejects the `promise`.
 */
function defer() {
    const dfd = {};
    dfd.promise = new Promise((resolve, reject) => {
        dfd.resolve = resolve;
        dfd.reject = reject;
    });
    return dfd;
}

function promisify(owner, fn) {
    if (typeof owner === "function" && typeof fn !== "function") {
        fn = owner;
        owner = undefined;
    }
    if (!fn) {
        throw new TypeError("fn should be provided!");
    }
    const executor = fn;
    return (...args) => {
        return new Promise((resolve, reject) => {
            executor.apply(owner, [...args, callback]);
            function callback(err, ...results) {
                if (err)
                    return reject(err);
                if (results.length === 0)
                    return resolve();
                if (results.length === 1)
                    return resolve(results[0]);
                resolve(results);
            }
        });
    };
}

function denodify(ownerOrFn, ...args) {
    let owner = ownerOrFn, fn = args[0], num = 1;
    if (typeof owner === "function" && typeof fn !== "function") {
        fn = owner;
        owner = undefined;
        num = 0;
    }
    return promisify(owner, fn)(...args.slice(num));
}

/**
 * @public
 *
 * Utility function to log using `console.dir` the result or the error of the given `task`.
 * If the `task` succeeds, its result is returned.
 * If the `task` failed, the error is thrown.
 *
 * @param task - The task to call
 * @param args - The arguments to pass to the task
 */
function dir(task, ...args) {
    return exec(task, ...args).then(result => {
        console.dir(result);
        return result;
    }, err => {
        console.error(err);
        throw err;
    });
}

/**
 * @public
 *
 * The opposite of {@link doWhilst}.
 * Calls the `task` function until the `test` function returns `true`.
 *
 * Note: `test` is called after the first task.
 *
 * @param task - The task to execute while `test` fails
 * @param test - The function that test the result of `task`
 */
function doUntil(task, test) {
    return next();
    function next() {
        return exec(task)
            .then(res => test(res))
            .then(doContinue => {
            if (!doContinue) {
                return next();
            }
        });
    }
}

/**
 * @public
 *
 * Equivalent of `do`, `while` loop.
 * Calls the `task` function while the `test` function returns `true`.
 *
 * Note: `test` is called after the first task.
 *
 * @param task - The task to execute while `test` pass
 * @param test - The function that test the result of `task`
 */
function doWhilst(task, test) {
    return next();
    function next() {
        return exec(task)
            .then(res => test(res))
            .then(doContinue => {
            if (doContinue) {
                return next();
            }
        });
    }
}

/**
 * @public
 *
 * Applies the function `iterator` to each item in `arr`, in parallel.
 * The `iterator` is called with an item from the list, the index of this item and the list itself.
 * If the `iterator` emit a rejected Promise, the each function `Promise` result is instantly rejected.
 *
 * Note: since this function applies `iterator` to each item in parallel, there is no guarantee that the iterator functions will complete in order.
 *
 * @param array - The array to iterate on
 * @param iterator - The iterator to apply on each item
 */
function each(array, iterator) {
    const promises = array.map(executor);
    return Promise.all(promises).then(() => void 0);
    function executor(item, index, list) {
        return exec(iterator, item, index, list);
    }
}

/**
 * @public
 *
 * An Error that is thrown when a Queue execution fails and `waitToReject` option is set to true.
 */
class QueueError extends Error {
    constructor(innerErrors, results) {
        super("Errors occured while executing the Queue");
        this.name = this.constructor.name;
        if (Object.setPrototypeOf) {
            Object.setPrototypeOf(this, QueueError.prototype);
        }
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
        this.innerErrors = innerErrors;
        this.results = results;
    }
}

/* istanbul ignore file */
/**
 * @public
 *
 * Use the best next tick function depending on platform.
 *
 * @param cb - The callback to call on next tick
 */
const nextTick = (function (self) {
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
        const tempCallbacks = [];
        // Mutation Observer
        if (win.MutationObserver || win.WebKitMutationObserver) {
            const MutationObserver = win.MutationObserver || win.WebKitMutationObserver;
            const observer = new MutationObserver(() => {
                let cb;
                while ((cb = tempCallbacks.shift()) || tempCallbacks.length) {
                    if (cb)
                        cb();
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
            }
            else {
                win.attachEvent("onmessage", onGlobalMessage);
            }
            return (cb) => {
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
function createGlobalMessageHandler(win, tempCallbacks, messagePrefix) {
    return (event) => {
        if (event.source === win && typeof event.data === "string" && event.data.indexOf(messagePrefix) === 0) {
            let cb;
            while ((cb = tempCallbacks.shift()) || tempCallbacks.length) {
                if (cb)
                    cb();
            }
        }
    };
}
function canUsePostMessage(win) {
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
function getGlobal() {
    //@ts-ignore
    if (typeof self !== "undefined") {
        return self;
    }
    //@ts-ignore
    if (typeof window !== "undefined") {
        return window;
    }
    //@ts-ignore
    if (typeof global !== "undefined") {
        return global;
    }
    throw new Error("unable to locate global object");
}

/**
 * @public
 *
 * A Queue runs a `worker` function on each item that it contains but limit the number of concurrent runs.
 */
class Queue {
    /**
     * Creates a new Queue.
     *
     * @param worker - The worker function to apply on each item in Queue
     * @param limit - The maximum number of concurrent workers to launch
     * @param options - The options for the Queue
     */
    constructor(worker, limit = 1, options) {
        this.items = [];
        this.workers = 0;
        this.started = false;
        this.paused = false;
        this.hasException = false;
        this.stopOnError = false;
        this.waitToReject = false;
        this.worker = worker;
        this.limit = limit;
        if (options) {
            const keys = Object.keys(options);
            for (const key of keys) {
                if (options[key])
                    this[key] = options[key];
            }
        }
    }
    get length() {
        return this.items.length + this.workers;
    }
    get running() {
        return this.workers > 0;
    }
    get idle() {
        return this.items.length + this.workers === 0;
    }
    push(...datas) {
        if (datas.length === 1 && Array.isArray(datas[0])) {
            datas = datas[0];
        }
        return this.insert(datas);
    }
    unshift(...datas) {
        if (datas.length === 1 && Array.isArray(datas[0])) {
            datas = datas[0];
        }
        return this.insert(datas, true);
    }
    pause() {
        this.paused = true;
    }
    resume() {
        if (!this.paused) {
            return;
        }
        this.paused = false;
        this.hasException = false;
        for (let i = this.limit; i > 0; i--) {
            this.process();
        }
    }
    clear() {
        this.ondrain = undefined;
        this.items = [];
    }
    insert(datas, before) {
        const length = datas.length;
        if (length === 0) {
            return Promise.resolve([]);
        }
        const dfd = defer();
        if (!this.started) {
            this.started = true;
        }
        const iterator = createIterator(length, dfd);
        if (before)
            this.items.unshift(...datas.map(iterator, this));
        else
            this.items.push(...datas.map(iterator, this));
        if (this.onsaturated && this.items.length >= this.limit) {
            this.onsaturated();
        }
        for (let i = this.limit; i > 0; i--) {
            this.process();
        }
        return dfd.promise;
        function createIterator(count, dfd) {
            const errors = [];
            const results = [];
            return function (data) {
                return this.createItem(data, results, errors, count, dfd.resolve, dfd.reject);
            };
        }
    }
    createItem(data, results, errors, count, resolve, reject) {
        return {
            data: data,
            resolver: res => {
                results.push(res);
                const resultsLen = results.length;
                if (resultsLen === count) {
                    resolve(resultsLen === 1 ? results[0] : results);
                }
                if (errors.length + resultsLen === count) {
                    reject(new QueueError(errors, results));
                }
            },
            rejecter: err => {
                if (!this.waitToReject || this.stopOnError) {
                    return reject(err);
                }
                errors.push(err);
                if (errors.length + results.length === count) {
                    reject(new QueueError(errors, results));
                }
            }
        };
    }
    process() {
        if (this.paused || this.workers >= this.limit || !this.items.length || (this.stopOnError && this.hasException)) {
            return;
        }
        const item = this.items.shift();
        if (!item) {
            return;
        }
        if (this.onempty && this.items.length === 0) {
            this.onempty();
        }
        this.workers += 1;
        nextTick(this.createItemProcess(item));
    }
    createItemProcess(item) {
        return () => {
            exec(this.worker, item.data).then(res => {
                item.resolver.call(undefined, res);
                this.onProcessEnd();
            }, err => {
                item.rejecter.call(undefined, err);
                this.hasException = true;
                this.onProcessEnd();
            });
        };
    }
    onProcessEnd() {
        this.workers -= 1;
        if (this.ondrain && this.items.length + this.workers === 0) {
            this.ondrain();
        }
        this.process();
    }
}

/**
 * @public
 *
 * The same as {@link Queue} but items are the tasks to execute.
 */
class TaskQueue extends Queue {
    /**
     * Creates a new  TaskQueue.
     *
     * @param limit - The maximum number of concurrent tasks to launch
     * @param options - The options for the TaskQueue
     */
    constructor(limit, options) {
        super(item => item(), limit, options);
    }
}

/**
 * @public
 *
 * Sames as {@link each} but limit the number of concurrent iterator.
 *
 * @param array - The array to iterate on
 * @param limit - The maximum number of iterator to run concurrently
 * @param iterator - The iterator to apply on each item
 * @param options - The options for the inner TaskQueue
 */
function eachLimit(array, limit, iterator, options) {
    const queue = new TaskQueue(limit, options || { stopOnError: true });
    const iterators = array.map((value, index, list) => () => iterator(value, index, list));
    return queue.push(iterators).then(() => void 0);
}

/**
 * @public
 *
 * Returns the first value in `array` that passes an async truth test.
 * The `iterator` is applied in parallel, meaning the first iterator to return `true` resolve the global `find` Promise.
 * That means the result might not be the first item in the original `array` (in terms of order) that passes the test.
 * If order within the original `array` is important, then look at `findSeries`.
 *
 * @param array - The array to iterate on
 * @param iterator - The iterator which test each item
 */
function find(array, iterator) {
    const len = array.length;
    let count = 0;
    return new Promise((resolve, reject) => {
        array.forEach(finder);
        function finder(value, index, list) {
            return exec(iterator, value, index, list).then(valid => {
                if (valid) {
                    return resolve(value);
                }
                if (++count === len) {
                    resolve();
                }
            }, reject);
        }
    });
}

/**
 * @public
 *
 * Returns `true` if every element in `array` satisfies an async test.
 *
 * @param array - The array to iterate on
 * @param iterator - The iterator which test each item
 */
function every(array, iterator) {
    return find(array, invert).then(result => !result);
    function invert(item, index, list) {
        return exec(iterator, item, index, list).then(result => !result);
    }
}

/**
 * @public
 *
 * Returns a new array of all the values in `array` which pass an async truth test.
 * The Promise returned by each `iterator` call can only returns `boolean` value!
 * This operation is performed in parallel, the results array could be in a different order as the original.
 * If the order matters, you could use the `findSeries` function.
 *
 * @param array - The array to iterate on
 * @param iterator - The iterator which test each item
 */
function filter(array, iterator) {
    const results = [];
    return Promise.all(array.map(filterr)).then(() => results);
    function filterr(value, index, list) {
        return exec(iterator, value, index, list).then(include => {
            if (include)
                results.push(value);
        });
    }
}

/**
 * @public
 *
 * The same as {@link filter} only the `iterator` is applied to each item in `array` in series.
 * The next `iterator` is only called once the current one has completed.
 * The results array will be in the same order as the original.
 *
 * @param array - The array to iterate on
 * @param iterator - The iterator which test each item
 */
function filterSeries(array, iterator) {
    const results = [];
    return eachSeries(array, filterr).then(() => results);
    function filterr(item, index) {
        return resolve(iterator(item, index, array)).then(include => {
            if (include)
                results.push(item);
        });
    }
}

/**
 * @public
 *
 * The same as {@link find}, only the `iterator` is applied to each item in `array` in series.
 * This means the result is always the first in the original `array` (in terms of array order) that passes the truth test.
 *
 * @param array - The array to iterate on
 * @param iterator - The iterator which test each item
 */
function findSeries(array, iterator) {
    const last = array.length - 1;
    return recurse();
    function recurse(index = 0) {
        const value = array[index];
        return exec(iterator, value, index, array)
            .then(valid => {
            if (valid) {
                return value;
            }
            if (index < last) {
                return recurse(index + 1);
            }
        });
    }
}

/**
 * @public
 *
 * Calls the `task` indefinitely.
 * Note: if `task` throws, the process stops.
 *
 * @param task - The task to execute until it fails
 */
function forever(task) {
    return next();
    function next() {
        return exec(task).then(next);
    }
}

/**
 * @public
 *
 * Returns a Promise that resolves on next tick.
 */
function immediate() {
    return new Promise(resolve => { nextTick(resolve); });
}

/**
 * @public
 *
 * Utility function to log the result or the error of the given `task`.
 * If the `task` succeeds, its result is returned.
 * If the `task` failed, the error is thrown.
 *
 * @param task - The task to call
 * @param args - The arguments to pass to the task
 */
function log(task, ...args) {
    return exec(task, ...args).then(result => {
        console.log(result);
        return result;
    }, err => {
        console.error(err);
        throw err;
    });
}

/**
 * @public
 *
 * Sames as {@link map} but limit the number of iterators that run concurrently.
 *
 * Note: The resulting array may not be in the same order as the source array.
 *
 * @param array - The array to iterate on
 * @param limit - The maximum number of iterator to run concurrently
 * @param iterator - The iterator that map each item
 * @param options - The options for the inner TaskQueue
 */
function mapLimit(array, limit, iterator, options) {
    const queue = new TaskQueue(limit, options || { stopOnError: true });
    const iterators = array.map((value, index, list) => () => iterator(value, index, list));
    return queue.push(iterators);
}

/**
 * @public
 *
 * Prepare a function that call the `task` and memoize the result to avoid calling it again.
 * If `hash` is `true`, memoize the result based on a hash of input arguments (default hash function: `JSON.stringify(args)`).
 * If `hash` is a function, memoize the result based on the hash returned by the function (signature: (args: any[]) =\> string).
 *
 * Note: The `hash` function is synchronous.
 *
 * @param task - The task to memoize
 * @param hash - `true` to enable simple arguments hashing (JSON.stringify), or a function to hash arguments
 */
function memoize(task, hash) {
    const cache = {};
    const hasher = typeof hash === "function" ? hash : hash === true ? JSON.stringify : undefined;
    return (...args) => {
        const hashed = hasher === null || hasher === void 0 ? void 0 : hasher(args);
        const cached = cache[hashed || "default"];
        if (cached) {
            return resolve(cached);
        }
        const promise = exec(task, ...args)
            .then(res => save(cache, hashed, res));
        return save(cache, hashed, promise);
    };
}
function save(cache, hashed, value) {
    cache[hashed || "default"] = value;
    return value;
}

/**
 * @public
 *
 * Sames as {@link parallel} but limit the number of tasks that run concurrently.
 *
 * @param tasks - The array or object containing tasks to execute
 * @param limit - The maximum number of tasks to run concurrently
 * @param options - The options for the inner TaskQueue
 */
function parallelLimit(tasks, limit, options) {
    options = options || { stopOnError: true };
    if (Array.isArray(tasks)) {
        const queue = new TaskQueue(limit, options);
        return queue.push(tasks);
    }
    const obj = tasks;
    const result = {};
    const queue = new Queue(worker, limit, options);
    return queue.push(Object.keys(obj)).then(() => result);
    function worker(key) {
        return execOn(obj, obj[key]).then(res => {
            result[key] = res;
        });
    }
}

/**
 * @public
 *
 * Create a new function which exec `task` by combining arguments.
 *
 * @param task - the function to partialize
 * @param preArgs - arguments to bind to task
 */
function partial(task, ...preArgs) {
    return (...args) => {
        return exec(task, ...preArgs.concat(args));
    };
}

function partialOn(owner, taskOrFunction, ...topArgs) {
    const task = typeof taskOrFunction === "string" ? owner[taskOrFunction] : taskOrFunction;
    return (...args) => execOn(owner, task, ...topArgs.concat(args));
}

/**
 * @public
 *
 * A PriorityQueue is like a {@link Queue} but executes items in priority order.
 */
class PriorityQueue extends Queue {
    /**
     * Creates a new PriorityQueue.
     *
     * @param worker - The worker function to apply on each item in PriorityQueue
     * @param limit - The maximum number of concurrent workers to launch
     * @param options - The options for the PriorityQueue
     */
    constructor(worker, limit, options) {
        super(worker, limit, options);
        this.defaultPriority = 1;
        this.items = [];
        if (typeof (options === null || options === void 0 ? void 0 : options.defaultPriority) !== "undefined") {
            this.defaultPriority = options.defaultPriority;
        }
    }
    push(...datas) {
        let priority = this.defaultPriority;
        if (typeof datas[0] === "number" && datas.length > 1) {
            priority = datas.shift();
        }
        if (datas.length === 1 && Array.isArray(datas[0])) {
            datas = datas[0];
        }
        return this.insertAt(datas, priority);
    }
    unshift(...datas) {
        let priority = this.defaultPriority;
        if (typeof datas[0] === "number" && datas.length > 1) {
            priority = datas.shift();
        }
        if (datas.length === 1 && Array.isArray(datas[0])) {
            datas = datas[0];
        }
        return this.insertAt(datas, priority);
    }
    insertAt(datas, priority) {
        const length = datas.length;
        if (length === 0) {
            return Promise.resolve([]);
        }
        const index = this.binarySearch(this.items, { priority }, this.compareTasks) + 1;
        const dfd = defer();
        if (!this.started) {
            this.started = true;
        }
        const iterator = createIterator(length, dfd, priority);
        this.items.splice(index, 0, ...datas.map(iterator, this));
        if (this.onsaturated && this.items.length >= this.limit) {
            this.onsaturated();
        }
        for (let i = this.limit; i > 0; i--) {
            this.process();
        }
        return dfd.promise;
        function createIterator(count, dfd, priority) {
            const errors = [];
            const results = [];
            return function (data) {
                const item = this.createItem(data, results, errors, count, dfd.resolve, dfd.reject);
                item.priority = priority;
                return item;
            };
        }
    }
    binarySearch(seq, item, compare) {
        let beg = -1;
        let end = seq.length - 1;
        let mid;
        while (beg < end) {
            mid = beg + ((end - beg + 1) >>> 1);
            if (compare(item, seq[mid]) >= 0) {
                beg = mid;
            }
            else {
                end = mid - 1;
            }
        }
        return beg;
    }
    compareTasks(a, b) {
        return (a.priority || 0) - (b.priority || 0);
    }
}

/**
 * @public
 *
 * The same as {@link PriorityQueue} but items are the tasks to execute.
 */
class PriorityTaskQueue extends PriorityQueue {
    /**
     * Creates a new PriorityTaskQueue.
     *
     * @param limit - The maximum number of concurrent tasks to launch
     * @param options - The options for the PriorityTaskQueue
     */
    constructor(limit, options) {
        super(item => item(), limit, options);
    }
}

/**
 * @public
 *
 * A ProgressPromise is a special Promise which allows to track progress of the inner process.
 */
class ProgressPromise {
    constructor(executor) {
        this._progress = undefined;
        this._progressesCallbacks = [];
        if (!(this instanceof ProgressPromise)) {
            throw new TypeError("Failed to construct 'ProgressPromise': Please use the 'new' operator, this object constructor cannot be called as a function.");
        }
        this._innerPromise = new Promise((resolve, reject) => {
            executor(resolve, reject, this.createProgressFunction());
        });
        const clean = this.cleaner.bind(this);
        this._innerPromise.then(clean, clean);
    }
    /**
     * Adds a progress callback who listen to progress evolution of the `ProgressPromise`.
     *
     * @param onprogress - The callback to execute when the ProgressPromise progress changed.
     * @returns - This Promise
     */
    progress(onprogress) {
        var _a;
        if (typeof onprogress !== "function")
            return this;
        (_a = this._progressesCallbacks) === null || _a === void 0 ? void 0 : _a.push(onprogress);
        if (typeof this._progress !== "undefined") {
            onprogress(this._progress);
        }
        return this;
    }
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     *
     * @param onfulfilled - The callback to execute when the Promise is resolved.
     * @param onrejected - The callback to execute when the Promise is rejected.
     *
     * @returns - A Promise for the completion of which ever callback is executed.
     */
    then(onfulfilled, onrejected) {
        return this._innerPromise.then(onfulfilled, onrejected);
    }
    /**
     * Attaches a callback for only the rejection of the Promise.
     *
     * @param onrejected - The callback to execute when the Promise is rejected.
     *
     * @returns - A Promise for the completion of the callback.
     */
    catch(onrejected) {
        return this._innerPromise.catch(onrejected);
    }
    /**
     * Attaches a callback that is invoked when the `Promise` is settled (fulfilled or rejected).
     * The resolved value cannot be modified from the callback.
     *
     * @param onfinally - The callback to execute when the `Promise` is settled (`fulfilled` or `rejected`).
     * @returns - A Promise for the completion of the callback.
     */
    finally(onfinally) {
        if (typeof onfinally !== "function") {
            return this._innerPromise.then();
        }
        return this._innerPromise.then((value) => resolve(onfinally()).then(() => value), (reason) => resolve(onfinally()).then(() => { throw reason; }));
    }
    /**
     * Returns a new ProgressPromiseDeferred object.
     */
    static defer() {
        const def = {};
        def.promise = new ProgressPromise((res, rej, pro) => {
            def.resolve = res;
            def.reject = rej;
            def.progress = pro;
        });
        return def;
    }
    /**
     * Creates a `ProgressPromise` that is resolved with an array of results when all of the provided Promises resolve, or rejected when any Promise is rejected.
     *
     * The `progress` function returns an array of all progresses from found ProgressPromises in `values`.
     *
     * @param values - An array of Promises.
     * @returns - A new Promise.
     */
    static all(values) {
        return new ProgressPromise((resolve, reject, progress) => {
            initAllProgresses(values, progress);
            Promise.all(values).then(resolve, reject);
        });
    }
    /**
     * Creates a Promise that is resolved or rejected when any of the provided Promises are resolved or rejected.
     * The `progress` function returns an array of all progresses from found ProgressPromises in `values`.
     *
     * @param values - An array of Promises.
     * @returns - A new Promise.
     */
    static race(promises) {
        return new ProgressPromise((resolve, reject, progress) => {
            initAllProgresses(promises, progress);
            Promise.race(promises).then(resolve, reject);
        });
    }
    cleaner() {
        this._progressesCallbacks = undefined;
    }
    createProgressFunction() {
        return (val) => {
            const callbacks = this._progressesCallbacks;
            if (!callbacks)
                return;
            const len = callbacks.length;
            for (let i = 0; i < len; i++) {
                callbacks[i](val);
            }
            this._progress = val;
        };
    }
}
function initAllProgresses(promises, progress) {
    const len = promises.length;
    const progresses = new Array(len);
    for (let i = 0; i < len; i++) {
        const p = promises[i];
        progresses[i] = undefined;
        if (isProgressPromise(p)) {
            p.progress(createAllProgressCallback(progress, progresses, i));
        }
    }
}
function createAllProgressCallback(progress, progresses, index) {
    return (val) => {
        progresses[index] = val;
        progress(progresses);
    };
}
function isProgressPromise(p) {
    return "progress" in p && "then" in p;
}

/**
 * @public
 *
 * Reduces `array` into a single value using an async `iterator` to return each successive step.
 * `memo` is the initial state of the reduction.
 * This function only operates in series.
 *
 * For performance reasons, it may make sense to split a call to this function into a parallel map,
 * and then use the normal `Array.prototype.reduce` on the results.
 *
 * This function is for situations where each step in the reduction needs to be async;
 * if you can get the data before reducing it, then it's probably a good idea to do so.
 *
 * @param array - The array to iterate on
 * @param memo - The starting value for the reduce operation
 * @param iterator - The function that reduce each item and return the reduced result
 */
function reduce(array, memo, iterator) {
    return eachSeries(array, reducer).then(() => memo);
    function reducer(item, index, list) {
        return resolve(iterator(memo, item, index, list)).then(result => {
            memo = result;
        });
    }
}

/**
 * @public
 *
 * Same as {@link reduce}, only operates on `array` in reverse order.
 *
 * @param array - The array to iterate on
 * @param memo - The starting value for the reduce operation
 * @param iterator - The function that reduce each item and return the reduced result
 */
function reduceRight(array, memo, iterator) {
    return eachSeries([...array].reverse(), reducer).then(() => memo);
    function reducer(item, index) {
        return resolve(iterator(memo, item, index, array)).then(result => {
            memo = result;
        });
    }
}

/**
 * @public
 *
 * The opposite of {@link filter}.
 * Removes values that pass an `async` truth test.
 *
 * @param array - The array to iterate on
 * @param iterator - The iterator which test each item
 */
function reject(array, iterator) {
    const results = [];
    return Promise.all(array.map(rejecter)).then(() => results);
    function rejecter(item, index, list) {
        return exec(iterator, item, index, list).then(include => {
            if (!include)
                results.push(item);
        });
    }
}

/**
 * @public
 *
 * The same as {@link reject}, only the `iterator` is applied to each item in `array` in series.
 *
 * @param array - The array to iterate on
 * @param iterator - The iterator which test each item
 */
function rejectSeries(array, iterator) {
    const results = [];
    return eachSeries(array, rejecter).then(() => results);
    function rejecter(item, index, list) {
        return resolve(iterator(item, index, list)).then(include => {
            if (!include)
                results.push(item);
        });
    }
}

/**
 * @public
 *
 * Executes the `task` and retry if failed.
 * If `task` fails the given number of `times`, the promise is rejected.
 *
 * @param times - The number of times the `task` should be retried
 * @param task - The task to retry if it fails
 */
function retry(times, task) {
    return exec(task).catch(err => {
        if (times > 1) {
            return retry(times - 1, task);
        }
        throw err;
    });
}

/**
 * @public
 *
 * Prepare a new function that transfer its arguments to the fist `task` then calls each `task` using the result of the previous `task`.
 * Resolves with the result of the last `task`.
 * Note: Execution order if from start to end.
 *
 * @param tasks - Functions to be run from start to end
 */
function seq(...tasks) {
    return function (...args) {
        let p = resolve();
        const len = tasks.length;
        if (!len)
            return p;
        const first = tasks[0];
        p = p.then(() => first.apply(this, args));
        for (let i = 1; i < len; i++) {
            p = p.then(tasks[i]);
        }
        return p;
    };
}

/**
 * @public
 *
 * Returns `true` if at least one element in the `array` satisfies an async test.
 * The `Promise` returned by each `iterator` call can only returns boolean value!
 * Once any iterator call returns `true`, the main `Promise` is resolved.
 *
 * @param array - The array to iterate on
 * @param iterator - The iterator which test each item
 */
function some(array, iterator) {
    return find(array, iterator).then(result => !!result);
}

/**
 * @public
 *
 * Sorts a list by the results of running each `array` value through an async `iterator`.
 *
 * @param array - The array to iterate on
 * @param iterator - The function which returns the sort index
 */
function sortBy(array, iterator) {
    return map(array, sortMapper).then(result => result.sort(sortFunction).map(i => i.source));
    function sortMapper(item, index) {
        return resolve(iterator(item, index, array))
            .then(res => ({ source: item, result: res }));
    }
    function sortFunction(left, right) {
        const a = left.result, b = right.result;
        return a < b ? -1 : a > b ? 1 : 0;
    }
}

/**
 * @public
 *
 * Build a function that takes an argument, calls the `task` and resolve with the input argument.
 * This function is usefull to call a function during a Promise chain without breaking the chain.
 *
 * @example
 * ```typescript
 * return myAwesomeTask()
 *     .then(result => `prefix-${result}`)
 *     .then(promizr.tap(logActionToServer, token))
 *     .then(result => result.startsWith("prefix-"));
 * ```
 *
 * @param task - The function to be called during tap.
 * @param args - The arguments to be called to task.
 */
function tap(task, ...args) {
    return (result) => exec(task, ...args).then(() => result);
}

function tapOn(owner, taskOrFunction, ...args) {
    const task = typeof taskOrFunction === "string" ? owner[taskOrFunction] : taskOrFunction;
    return (res) => execOn(owner, task, ...args).then(() => res);
}

/**
 * @public
 *
 * Returns a Promise that resolves when timer is done.
 *
 * @param ms - Milliseconds to wait before resolving the Promise
 */
function timeout(ms) {
    return new Promise(resolve => {
        setTimeout(() => { resolve(); }, ms || 1);
    });
}

/**
 * @public
 *
 * Executes `task` the given number of `times`.
 * Returns an array with the result of each `task` execution.
 *
 * @param times - The number of times `task` should be called
 * @param task - The task to run multiple times
 */
function times(times, task) {
    const results = [];
    for (let i = times; i > 0; i--) {
        results.push(exec(task));
    }
    return Promise.all(results);
}

/**
 * @public
 *
 * The same as {@link times}, only `tasks` are applied in series.
 * The next `task` is only called once the current one has completed.
 *
 * @param times - The number of times `task` should be called
 * @param task - The task to run multiple times
 */
function timesSeries(times, task) {
    const results = [];
    let p = resolve();
    for (let i = times; i > 0; i--) {
        p = p.then(capture);
    }
    return p.then(() => results);
    function capture() {
        return resolve(task()).then(result => { results.push(result); });
    }
}

function uncallbackify(ownerOrFn, ...args) {
    let owner = ownerOrFn, fn = args[0], num = 1;
    if (typeof owner === "function" && typeof fn !== "function") {
        fn = owner;
        owner = undefined;
        num = 0;
    }
    return cbpromisify(owner, fn)(...args.slice(num));
}

/**
 * @public
 *
 * The opposite of {@link whilst}.
 * Calls the `task` function until the `test` function returns `true`.
 *
 * @param test - The function that test if the process should continue
 * @param task - The task to execute while `test` fails
 */
function until(test, task) {
    return next();
    function next() {
        return exec(test).then(doContinue => {
            if (!doContinue) {
                return exec(task).then(next);
            }
        });
    }
}

/**
 * @public
 *
 * Calls each `task` using the result of the previous `task`.
 * Resolves with the result of the last `task`.
 * The first `task` should not take any argument.
 *
 * @param tasks - Functions to run in order
 */
function waterfall(tasks) {
    let p = resolve();
    for (const task of tasks) {
        p = p.then(task);
    }
    return p;
}

/**
 * @public
 *
 * Equivalent of `while` loop.
 * Calls the `task` function while the `test` function returns `true`.
 *
 * @param test - The function that test if the process should continue
 * @param task - The task to execute while `test` pass
 */
function whilst(test, task) {
    return next();
    function next() {
        return exec(test).then(doContinue => {
            if (doContinue) {
                return exec(task).then(next);
            }
        });
    }
}

export { PriorityQueue, PriorityTaskQueue, ProgressPromise, Queue, QueueError, TaskQueue, apply, applyEach, applyEachSeries, applyOn, cbpromisify, compose, concat, concatSeries, defer, denodify, dir, doUntil, doWhilst, each, eachLimit, eachSeries, every, exec, execOn, filter, filterSeries, find, findSeries, each as forEach, eachLimit as forEachLimit, eachSeries as forEachSeries, forever, immediate, log, map, mapLimit, mapSeries, memoize, nextTick, parallel, parallelLimit, partial, partialOn, promisify, reduce, reduceRight, reject, rejectSeries, resolve, retry, seq, series, some, sortBy, tap, tapOn, timeout, times, timesSeries, uncallbackify, until, waterfall, whilst };
