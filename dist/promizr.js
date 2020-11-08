(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.promizr = {}));
}(this, (function (exports) { 'use strict';

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }

    /**
     * @public
     *
     * Alias for `Promise.resolve`.
     */
    var resolve = Promise.resolve.bind(Promise);

    /**
     * @public
     *
     * Execute `task` with given arguments by ensuring that the result is a Promise.
     * If task throws synchronously, it's wrapped as a Promise.
     *
     * @param task - The function to call
     * @param args - The arguments to pass to task
     */
    function exec(task) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        try {
            return resolve(task.apply(void 0, args));
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
    function apply(action) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return function () { return exec.apply(void 0, __spreadArrays([action], args)); };
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
        var promises = array.map(function (task) { return exec(task); });
        return Promise.all(promises);
    }
    function objectParallel(obj) {
        var results = {};
        var promises = [];
        for (var key in obj) {
            if (typeof obj[key] === "function") {
                promises.push(interator(key, obj[key]));
            }
        }
        return Promise.all(promises).then(function () { return results; });
        function interator(key, executor) {
            return exec(executor).then(function (result) { results[key] = result; });
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
        return function () {
            var _this = this;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var iterators = tasks.map(function (e) { return function () { return e.apply(_this, args); }; });
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
        var results = [];
        var len = array.length;
        var p = resolve();
        for (var i = 0; i < len; i++) {
            p = p.then(createIterator(array[i]));
        }
        return p.then(function () { return results; });
        function createIterator(executor) {
            return function () {
                return resolve(executor()).then(function (result) { results.push(result); });
            };
        }
    }
    function objectSeries(obj) {
        var results = {};
        var p = resolve();
        for (var key in obj) {
            if (typeof obj[key] === "function") {
                p = p.then(createIterator(key, obj[key]));
            }
        }
        return p.then(function () { return results; });
        function createIterator(key, executor) {
            return function () {
                return resolve(executor()).then(function (result) { results[key] = result; });
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
        return function () {
            var _this = this;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var iterators = tasks.map(function (e) { return function () { return e.apply(_this, args); }; });
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
    function execOn(owner, task) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        try {
            return resolve(task.apply(owner, args));
        }
        catch (err) {
            return Promise.reject(err);
        }
    }

    function applyOn(owner, taskOrFunction) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var task = typeof taskOrFunction === "string" ? owner[taskOrFunction] : taskOrFunction;
        return function () { return execOn.apply(void 0, __spreadArrays([owner, task], args)); };
    }

    function cbpromisify(owner, fn) {
        if (typeof owner === "function" && typeof fn !== "function") {
            fn = owner;
            owner = undefined;
        }
        if (!fn) {
            throw new TypeError("fn should be provided!");
        }
        var executor = fn;
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return new Promise(function (resolve, reject) {
                executor.apply(owner, __spreadArrays(args, [success, error]));
                function success() {
                    var results = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        results[_i] = arguments[_i];
                    }
                    if (results.length === 0)
                        return resolve();
                    if (results.length === 1)
                        return resolve(results[0]);
                    resolve(results);
                }
                function error() {
                    var errors = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        errors[_i] = arguments[_i];
                    }
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
    function compose() {
        var tasks = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            tasks[_i] = arguments[_i];
        }
        return function () {
            var _this = this;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var p = resolve();
            var len = tasks.length;
            if (!len)
                return p;
            var last = tasks[len - 1];
            p = p.then(function () { return last.apply(_this, args); });
            for (var i = len - 2; i >= 0; i--) {
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
        var promises = array.map(mapper);
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
            .then(function (results) {
            var _a;
            return (_a = []).concat.apply(_a, results.filter(function (a) { return !!a; }));
        });
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
        return new Promise(function (res, reject) {
            var len = array.length;
            var p = resolve();
            for (var i = 0; i < len; i++) {
                p = p.then(createIterator(array[i], i, array));
            }
            return p.then(function () { return res(); }, reject);
            function createIterator(value, index, list) {
                return function () { return iterator(value, index, list); };
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
        var results = [];
        return eachSeries(array, mapper).then(function () { return results; });
        function mapper(item, index, list) {
            return resolve(iterator(item, index, list)).then(function (result) {
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
            .then(function (results) {
            var _a;
            return (_a = []).concat.apply(_a, results.filter(function (a) { return !!a; }));
        });
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
        var dfd = {};
        dfd.promise = new Promise(function (resolve, reject) {
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
        var executor = fn;
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return new Promise(function (resolve, reject) {
                executor.apply(owner, __spreadArrays(args, [callback]));
                function callback(err) {
                    var results = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        results[_i - 1] = arguments[_i];
                    }
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

    function denodify(ownerOrFn) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var owner = ownerOrFn, fn = args[0], num = 1;
        if (typeof owner === "function" && typeof fn !== "function") {
            fn = owner;
            owner = undefined;
            num = 0;
        }
        return promisify(owner, fn).apply(void 0, args.slice(num));
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
    function dir(task) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return exec.apply(void 0, __spreadArrays([task], args)).then(function (result) {
            console.dir(result);
            return result;
        }, function (err) {
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
                .then(function (res) { return test(res); })
                .then(function (doContinue) {
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
                .then(function (res) { return test(res); })
                .then(function (doContinue) {
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
        var promises = array.map(executor);
        return Promise.all(promises).then(function () { return void 0; });
        function executor(item, index, list) {
            return exec(iterator, item, index, list);
        }
    }

    /**
     * @public
     *
     * An Error that is thrown when a Queue execution fails and `waitToReject` option is set to true.
     */
    var QueueError = /** @class */ (function (_super) {
        __extends(QueueError, _super);
        function QueueError(innerErrors, results) {
            var _this = _super.call(this, "Errors occured while executing the Queue") || this;
            _this.name = _this.constructor.name;
            if (Object.setPrototypeOf) {
                Object.setPrototypeOf(_this, QueueError.prototype);
            }
            if (Error.captureStackTrace) {
                Error.captureStackTrace(_this, _this.constructor);
            }
            _this.innerErrors = innerErrors;
            _this.results = results;
            return _this;
        }
        return QueueError;
    }(Error));

    /* istanbul ignore file */
    /**
     * @public
     *
     * Use the best next tick function depending on platform.
     *
     * @param cb - The callback to call on next tick
     */
    var nextTick = (function (self) {
        // Node.JS
        if (typeof self.process !== "undefined" && Object.prototype.toString.call(self.process) === "[object process]") {
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
        else if (typeof self.Uint8ClampedArray !== "undefined" && typeof self.importScripts !== "undefined" && typeof self.MessageChannel !== "undefined") {
            var channel_1 = new self.MessageChannel();
            return function (cb) {
                channel_1.port1.onmessage = cb;
                channel_1.port2.postMessage(0);
            };
        }
        // Browser
        else {
            var win_1 = self.window;
            var tempCallbacks_1 = [];
            // Mutation Observer
            if (win_1.MutationObserver || win_1.WebKitMutationObserver) {
                var MutationObserver = win_1.MutationObserver || win_1.WebKitMutationObserver;
                var observer = new MutationObserver(function () {
                    var cb;
                    while ((cb = tempCallbacks_1.shift()) || tempCallbacks_1.length) {
                        if (cb)
                            cb();
                    }
                });
                var node_1 = self.document.createTextNode("");
                observer.observe(node_1, { characterData: true });
                var iterations_1 = 0;
                return function (cb) {
                    tempCallbacks_1.push(cb);
                    node_1.data = (iterations_1 = ++iterations_1 % 2);
                };
            }
            // Post Message
            else if (canUsePostMessage(win_1)) {
                var messagePrefix_1 = "setImmediate$" + Math.random() + "$";
                var onGlobalMessage = createGlobalMessageHandler(win_1, tempCallbacks_1, messagePrefix_1);
                if (win_1.addEventListener) {
                    win_1.addEventListener("message", onGlobalMessage, false);
                }
                else {
                    win_1.attachEvent("onmessage", onGlobalMessage);
                }
                return function (cb) {
                    tempCallbacks_1.push(cb);
                    win_1.postMessage(messagePrefix_1 + Math.random() * 1000, "*");
                };
            }
            // Set timeout
            else {
                return function (cb) {
                    setTimeout(cb, 1);
                };
            }
        }
    })(getGlobal());
    function createGlobalMessageHandler(win, tempCallbacks, messagePrefix) {
        return function (event) {
            if (event.source === win && typeof event.data === "string" && event.data.indexOf(messagePrefix) === 0) {
                var cb = void 0;
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
            var oldOnMessage = win.onmessage;
            var postMessageIsAsynchronous_1 = true;
            win.onmessage = function () { postMessageIsAsynchronous_1 = false; };
            win.postMessage("", "*");
            win.onmessage = oldOnMessage;
            return postMessageIsAsynchronous_1;
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
    var Queue = /** @class */ (function () {
        /**
         * Creates a new Queue.
         *
         * @param worker - The worker function to apply on each item in Queue
         * @param limit - The maximum number of concurrent workers to launch
         * @param options - The options for the Queue
         */
        function Queue(worker, limit, options) {
            if (limit === void 0) { limit = 1; }
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
                var keys = Object.keys(options);
                for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                    var key = keys_1[_i];
                    if (options[key])
                        this[key] = options[key];
                }
            }
        }
        Object.defineProperty(Queue.prototype, "length", {
            get: function () {
                return this.items.length + this.workers;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Queue.prototype, "running", {
            get: function () {
                return this.workers > 0;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Queue.prototype, "idle", {
            get: function () {
                return this.items.length + this.workers === 0;
            },
            enumerable: false,
            configurable: true
        });
        Queue.prototype.push = function () {
            var datas = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                datas[_i] = arguments[_i];
            }
            if (datas.length === 1 && Array.isArray(datas[0])) {
                datas = datas[0];
            }
            return this.insert(datas);
        };
        Queue.prototype.unshift = function () {
            var datas = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                datas[_i] = arguments[_i];
            }
            if (datas.length === 1 && Array.isArray(datas[0])) {
                datas = datas[0];
            }
            return this.insert(datas, true);
        };
        Queue.prototype.pause = function () {
            this.paused = true;
        };
        Queue.prototype.resume = function () {
            if (!this.paused) {
                return;
            }
            this.paused = false;
            this.hasException = false;
            for (var i = this.limit; i > 0; i--) {
                this.process();
            }
        };
        Queue.prototype.clear = function () {
            this.ondrain = undefined;
            this.items = [];
        };
        Queue.prototype.insert = function (datas, before) {
            var _a, _b;
            var length = datas.length;
            if (length === 0) {
                return Promise.resolve([]);
            }
            var dfd = defer();
            if (!this.started) {
                this.started = true;
            }
            var iterator = createIterator(length, dfd);
            if (before)
                (_a = this.items).unshift.apply(_a, datas.map(iterator, this));
            else
                (_b = this.items).push.apply(_b, datas.map(iterator, this));
            if (this.onsaturated && this.items.length >= this.limit) {
                this.onsaturated();
            }
            for (var i = this.limit; i > 0; i--) {
                this.process();
            }
            return dfd.promise;
            function createIterator(count, dfd) {
                var errors = [];
                var results = [];
                return function (data) {
                    return this.createItem(data, results, errors, count, dfd.resolve, dfd.reject);
                };
            }
        };
        Queue.prototype.createItem = function (data, results, errors, count, resolve, reject) {
            var _this = this;
            return {
                data: data,
                resolver: function (res) {
                    results.push(res);
                    var resultsLen = results.length;
                    if (resultsLen === count) {
                        resolve(resultsLen === 1 ? results[0] : results);
                    }
                    if (errors.length + resultsLen === count) {
                        reject(new QueueError(errors, results));
                    }
                },
                rejecter: function (err) {
                    if (!_this.waitToReject || _this.stopOnError) {
                        return reject(err);
                    }
                    errors.push(err);
                    if (errors.length + results.length === count) {
                        reject(new QueueError(errors, results));
                    }
                }
            };
        };
        Queue.prototype.process = function () {
            if (this.paused || this.workers >= this.limit || !this.items.length || (this.stopOnError && this.hasException)) {
                return;
            }
            var item = this.items.shift();
            if (!item) {
                return;
            }
            if (this.onempty && this.items.length === 0) {
                this.onempty();
            }
            this.workers += 1;
            nextTick(this.createItemProcess(item));
        };
        Queue.prototype.createItemProcess = function (item) {
            var _this = this;
            return function () {
                exec(_this.worker, item.data).then(function (res) {
                    item.resolver.call(undefined, res);
                    _this.onProcessEnd();
                }, function (err) {
                    item.rejecter.call(undefined, err);
                    _this.hasException = true;
                    _this.onProcessEnd();
                });
            };
        };
        Queue.prototype.onProcessEnd = function () {
            this.workers -= 1;
            if (this.ondrain && this.items.length + this.workers === 0) {
                this.ondrain();
            }
            this.process();
        };
        return Queue;
    }());

    /**
     * @public
     *
     * The same as {@link Queue} but items are the tasks to execute.
     */
    var TaskQueue = /** @class */ (function (_super) {
        __extends(TaskQueue, _super);
        /**
         * Creates a new  TaskQueue.
         *
         * @param limit - The maximum number of concurrent tasks to launch
         * @param options - The options for the TaskQueue
         */
        function TaskQueue(limit, options) {
            return _super.call(this, function (item) { return item(); }, limit, options) || this;
        }
        return TaskQueue;
    }(Queue));

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
        var queue = new TaskQueue(limit, options || { stopOnError: true });
        var iterators = array.map(function (value, index, list) { return function () { return iterator(value, index, list); }; });
        return queue.push(iterators).then(function () { return void 0; });
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
        var len = array.length;
        var count = 0;
        return new Promise(function (resolve, reject) {
            array.forEach(finder);
            function finder(value, index, list) {
                return exec(iterator, value, index, list).then(function (valid) {
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
        return find(array, invert).then(function (result) { return !result; });
        function invert(item, index, list) {
            return exec(iterator, item, index, list).then(function (result) { return !result; });
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
        var results = [];
        return Promise.all(array.map(filterr)).then(function () { return results; });
        function filterr(value, index, list) {
            return exec(iterator, value, index, list).then(function (include) {
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
        var results = [];
        return eachSeries(array, filterr).then(function () { return results; });
        function filterr(item, index) {
            return resolve(iterator(item, index, array)).then(function (include) {
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
        var last = array.length - 1;
        return recurse();
        function recurse(index) {
            if (index === void 0) { index = 0; }
            var value = array[index];
            return exec(iterator, value, index, array)
                .then(function (valid) {
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
        return new Promise(function (resolve) { nextTick(resolve); });
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
    function log(task) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return exec.apply(void 0, __spreadArrays([task], args)).then(function (result) {
            console.log(result);
            return result;
        }, function (err) {
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
        var queue = new TaskQueue(limit, options || { stopOnError: true });
        var iterators = array.map(function (value, index, list) { return function () { return iterator(value, index, list); }; });
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
        var cache = {};
        var hasher = typeof hash === "function" ? hash : hash === true ? JSON.stringify : undefined;
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var hashed = hasher === null || hasher === void 0 ? void 0 : hasher(args);
            var cached = cache[hashed || "default"];
            if (cached) {
                return resolve(cached);
            }
            var promise = exec.apply(void 0, __spreadArrays([task], args)).then(function (res) { return save(cache, hashed, res); });
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
            var queue_1 = new TaskQueue(limit, options);
            return queue_1.push(tasks);
        }
        var obj = tasks;
        var result = {};
        var queue = new Queue(worker, limit, options);
        return queue.push(Object.keys(obj)).then(function () { return result; });
        function worker(key) {
            return execOn(obj, obj[key]).then(function (res) {
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
    function partial(task) {
        var preArgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            preArgs[_i - 1] = arguments[_i];
        }
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return exec.apply(void 0, __spreadArrays([task], preArgs.concat(args)));
        };
    }

    function partialOn(owner, taskOrFunction) {
        var topArgs = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            topArgs[_i - 2] = arguments[_i];
        }
        var task = typeof taskOrFunction === "string" ? owner[taskOrFunction] : taskOrFunction;
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return execOn.apply(void 0, __spreadArrays([owner, task], topArgs.concat(args)));
        };
    }

    /**
     * @public
     *
     * A PriorityQueue is like a {@link Queue} but executes items in priority order.
     */
    var PriorityQueue = /** @class */ (function (_super) {
        __extends(PriorityQueue, _super);
        /**
         * Creates a new PriorityQueue.
         *
         * @param worker - The worker function to apply on each item in PriorityQueue
         * @param limit - The maximum number of concurrent workers to launch
         * @param options - The options for the PriorityQueue
         */
        function PriorityQueue(worker, limit, options) {
            var _this = _super.call(this, worker, limit, options) || this;
            _this.defaultPriority = 1;
            _this.items = [];
            if (typeof (options === null || options === void 0 ? void 0 : options.defaultPriority) !== "undefined") {
                _this.defaultPriority = options.defaultPriority;
            }
            return _this;
        }
        PriorityQueue.prototype.push = function () {
            var datas = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                datas[_i] = arguments[_i];
            }
            var priority = this.defaultPriority;
            if (typeof datas[0] === "number" && datas.length > 1) {
                priority = datas.shift();
            }
            if (datas.length === 1 && Array.isArray(datas[0])) {
                datas = datas[0];
            }
            return this.insertAt(datas, priority);
        };
        PriorityQueue.prototype.unshift = function () {
            var datas = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                datas[_i] = arguments[_i];
            }
            var priority = this.defaultPriority;
            if (typeof datas[0] === "number" && datas.length > 1) {
                priority = datas.shift();
            }
            if (datas.length === 1 && Array.isArray(datas[0])) {
                datas = datas[0];
            }
            return this.insertAt(datas, priority);
        };
        PriorityQueue.prototype.insertAt = function (datas, priority) {
            var _a;
            var length = datas.length;
            if (length === 0) {
                return Promise.resolve([]);
            }
            var index = this.binarySearch(this.items, { priority: priority }, this.compareTasks) + 1;
            var dfd = defer();
            if (!this.started) {
                this.started = true;
            }
            var iterator = createIterator(length, dfd, priority);
            (_a = this.items).splice.apply(_a, __spreadArrays([index, 0], datas.map(iterator, this)));
            if (this.onsaturated && this.items.length >= this.limit) {
                this.onsaturated();
            }
            for (var i = this.limit; i > 0; i--) {
                this.process();
            }
            return dfd.promise;
            function createIterator(count, dfd, priority) {
                var errors = [];
                var results = [];
                return function (data) {
                    var item = this.createItem(data, results, errors, count, dfd.resolve, dfd.reject);
                    item.priority = priority;
                    return item;
                };
            }
        };
        PriorityQueue.prototype.binarySearch = function (seq, item, compare) {
            var beg = -1;
            var end = seq.length - 1;
            var mid;
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
        };
        PriorityQueue.prototype.compareTasks = function (a, b) {
            return (a.priority || 0) - (b.priority || 0);
        };
        return PriorityQueue;
    }(Queue));

    /**
     * @public
     *
     * The same as {@link PriorityQueue} but items are the tasks to execute.
     */
    var PriorityTaskQueue = /** @class */ (function (_super) {
        __extends(PriorityTaskQueue, _super);
        /**
         * Creates a new PriorityTaskQueue.
         *
         * @param limit - The maximum number of concurrent tasks to launch
         * @param options - The options for the PriorityTaskQueue
         */
        function PriorityTaskQueue(limit, options) {
            return _super.call(this, function (item) { return item(); }, limit, options) || this;
        }
        return PriorityTaskQueue;
    }(PriorityQueue));

    /**
     * @public
     *
     * A ProgressPromise is a special Promise which allows to track progress of the inner process.
     */
    var ProgressPromise = /** @class */ (function () {
        function ProgressPromise(executor) {
            var _this = this;
            this._progress = undefined;
            this._progressesCallbacks = [];
            if (!(this instanceof ProgressPromise)) {
                throw new TypeError("Failed to construct 'ProgressPromise': Please use the 'new' operator, this object constructor cannot be called as a function.");
            }
            this._innerPromise = new Promise(function (resolve, reject) {
                executor(resolve, reject, _this.createProgressFunction());
            });
            var clean = this.cleaner.bind(this);
            this._innerPromise.then(clean, clean);
        }
        /**
         * Adds a progress callback who listen to progress evolution of the `ProgressPromise`.
         *
         * @param onprogress - The callback to execute when the ProgressPromise progress changed.
         * @returns - This Promise
         */
        ProgressPromise.prototype.progress = function (onprogress) {
            var _a;
            if (typeof onprogress !== "function")
                return this;
            (_a = this._progressesCallbacks) === null || _a === void 0 ? void 0 : _a.push(onprogress);
            if (typeof this._progress !== "undefined") {
                onprogress(this._progress);
            }
            return this;
        };
        /**
         * Attaches callbacks for the resolution and/or rejection of the Promise.
         *
         * @param onfulfilled - The callback to execute when the Promise is resolved.
         * @param onrejected - The callback to execute when the Promise is rejected.
         *
         * @returns - A Promise for the completion of which ever callback is executed.
         */
        ProgressPromise.prototype.then = function (onfulfilled, onrejected) {
            return this._innerPromise.then(onfulfilled, onrejected);
        };
        /**
         * Attaches a callback for only the rejection of the Promise.
         *
         * @param onrejected - The callback to execute when the Promise is rejected.
         *
         * @returns - A Promise for the completion of the callback.
         */
        ProgressPromise.prototype.catch = function (onrejected) {
            return this._innerPromise.catch(onrejected);
        };
        /**
         * Attaches a callback that is invoked when the `Promise` is settled (fulfilled or rejected).
         * The resolved value cannot be modified from the callback.
         *
         * @param onfinally - The callback to execute when the `Promise` is settled (`fulfilled` or `rejected`).
         * @returns - A Promise for the completion of the callback.
         */
        ProgressPromise.prototype.finally = function (onfinally) {
            if (typeof onfinally !== "function") {
                return this._innerPromise.then();
            }
            return this._innerPromise.then(function (value) { return resolve(onfinally()).then(function () { return value; }); }, function (reason) { return resolve(onfinally()).then(function () { throw reason; }); });
        };
        /**
         * Returns a new ProgressPromiseDeferred object.
         */
        ProgressPromise.defer = function () {
            var def = {};
            def.promise = new ProgressPromise(function (res, rej, pro) {
                def.resolve = res;
                def.reject = rej;
                def.progress = pro;
            });
            return def;
        };
        /**
         * Creates a `ProgressPromise` that is resolved with an array of results when all of the provided Promises resolve, or rejected when any Promise is rejected.
         *
         * The `progress` function returns an array of all progresses from found ProgressPromises in `values`.
         *
         * @param values - An array of Promises.
         * @returns - A new Promise.
         */
        ProgressPromise.all = function (values) {
            return new ProgressPromise(function (resolve, reject, progress) {
                initAllProgresses(values, progress);
                Promise.all(values).then(resolve, reject);
            });
        };
        /**
         * Creates a Promise that is resolved or rejected when any of the provided Promises are resolved or rejected.
         * The `progress` function returns an array of all progresses from found ProgressPromises in `values`.
         *
         * @param values - An array of Promises.
         * @returns - A new Promise.
         */
        ProgressPromise.race = function (promises) {
            return new ProgressPromise(function (resolve, reject, progress) {
                initAllProgresses(promises, progress);
                Promise.race(promises).then(resolve, reject);
            });
        };
        ProgressPromise.prototype.cleaner = function () {
            this._progressesCallbacks = undefined;
        };
        ProgressPromise.prototype.createProgressFunction = function () {
            var _this = this;
            return function (val) {
                var callbacks = _this._progressesCallbacks;
                if (!callbacks)
                    return;
                var len = callbacks.length;
                for (var i = 0; i < len; i++) {
                    callbacks[i](val);
                }
                _this._progress = val;
            };
        };
        return ProgressPromise;
    }());
    function initAllProgresses(promises, progress) {
        var len = promises.length;
        var progresses = new Array(len);
        for (var i = 0; i < len; i++) {
            var p = promises[i];
            progresses[i] = undefined;
            if (isProgressPromise(p)) {
                p.progress(createAllProgressCallback(progress, progresses, i));
            }
        }
    }
    function createAllProgressCallback(progress, progresses, index) {
        return function (val) {
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
        return eachSeries(array, reducer).then(function () { return memo; });
        function reducer(item, index, list) {
            return resolve(iterator(memo, item, index, list)).then(function (result) {
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
        return eachSeries(__spreadArrays(array).reverse(), reducer).then(function () { return memo; });
        function reducer(item, index) {
            return resolve(iterator(memo, item, index, array)).then(function (result) {
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
        var results = [];
        return Promise.all(array.map(rejecter)).then(function () { return results; });
        function rejecter(item, index, list) {
            return exec(iterator, item, index, list).then(function (include) {
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
        var results = [];
        return eachSeries(array, rejecter).then(function () { return results; });
        function rejecter(item, index, list) {
            return resolve(iterator(item, index, list)).then(function (include) {
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
        return exec(task).catch(function (err) {
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
    function seq() {
        var tasks = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            tasks[_i] = arguments[_i];
        }
        return function () {
            var _this = this;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var p = resolve();
            var len = tasks.length;
            if (!len)
                return p;
            var first = tasks[0];
            p = p.then(function () { return first.apply(_this, args); });
            for (var i = 1; i < len; i++) {
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
        return find(array, iterator).then(function (result) { return !!result; });
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
        return map(array, sortMapper).then(function (result) { return result.sort(sortFunction).map(function (i) { return i.source; }); });
        function sortMapper(item, index) {
            return resolve(iterator(item, index, array))
                .then(function (res) { return ({ source: item, result: res }); });
        }
        function sortFunction(left, right) {
            var a = left.result, b = right.result;
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
    function tap(task) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return function (result) { return exec.apply(void 0, __spreadArrays([task], args)).then(function () { return result; }); };
    }

    function tapOn(owner, taskOrFunction) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var task = typeof taskOrFunction === "string" ? owner[taskOrFunction] : taskOrFunction;
        return function (res) { return execOn.apply(void 0, __spreadArrays([owner, task], args)).then(function () { return res; }); };
    }

    /**
     * @public
     *
     * Returns a Promise that resolves when timer is done.
     *
     * @param ms - Milliseconds to wait before resolving the Promise
     */
    function timeout(ms) {
        return new Promise(function (resolve) {
            setTimeout(function () { resolve(); }, ms || 1);
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
        var results = [];
        for (var i = times; i > 0; i--) {
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
        var results = [];
        var p = resolve();
        for (var i = times; i > 0; i--) {
            p = p.then(capture);
        }
        return p.then(function () { return results; });
        function capture() {
            return resolve(task()).then(function (result) { results.push(result); });
        }
    }

    function uncallbackify(ownerOrFn) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var owner = ownerOrFn, fn = args[0], num = 1;
        if (typeof owner === "function" && typeof fn !== "function") {
            fn = owner;
            owner = undefined;
            num = 0;
        }
        return cbpromisify(owner, fn).apply(void 0, args.slice(num));
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
            return exec(test).then(function (doContinue) {
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
        var p = resolve();
        for (var _i = 0, tasks_1 = tasks; _i < tasks_1.length; _i++) {
            var task = tasks_1[_i];
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
            return exec(test).then(function (doContinue) {
                if (doContinue) {
                    return exec(task).then(next);
                }
            });
        }
    }

    exports.PriorityQueue = PriorityQueue;
    exports.PriorityTaskQueue = PriorityTaskQueue;
    exports.ProgressPromise = ProgressPromise;
    exports.Queue = Queue;
    exports.QueueError = QueueError;
    exports.TaskQueue = TaskQueue;
    exports.apply = apply;
    exports.applyEach = applyEach;
    exports.applyEachSeries = applyEachSeries;
    exports.applyOn = applyOn;
    exports.cbpromisify = cbpromisify;
    exports.compose = compose;
    exports.concat = concat;
    exports.concatSeries = concatSeries;
    exports.defer = defer;
    exports.denodify = denodify;
    exports.dir = dir;
    exports.doUntil = doUntil;
    exports.doWhilst = doWhilst;
    exports.each = each;
    exports.eachLimit = eachLimit;
    exports.eachSeries = eachSeries;
    exports.every = every;
    exports.exec = exec;
    exports.execOn = execOn;
    exports.filter = filter;
    exports.filterSeries = filterSeries;
    exports.find = find;
    exports.findSeries = findSeries;
    exports.forEach = each;
    exports.forEachLimit = eachLimit;
    exports.forEachSeries = eachSeries;
    exports.forever = forever;
    exports.immediate = immediate;
    exports.log = log;
    exports.map = map;
    exports.mapLimit = mapLimit;
    exports.mapSeries = mapSeries;
    exports.memoize = memoize;
    exports.nextTick = nextTick;
    exports.parallel = parallel;
    exports.parallelLimit = parallelLimit;
    exports.partial = partial;
    exports.partialOn = partialOn;
    exports.promisify = promisify;
    exports.reduce = reduce;
    exports.reduceRight = reduceRight;
    exports.reject = reject;
    exports.rejectSeries = rejectSeries;
    exports.resolve = resolve;
    exports.retry = retry;
    exports.seq = seq;
    exports.series = series;
    exports.some = some;
    exports.sortBy = sortBy;
    exports.tap = tap;
    exports.tapOn = tapOn;
    exports.timeout = timeout;
    exports.times = times;
    exports.timesSeries = timesSeries;
    exports.uncallbackify = uncallbackify;
    exports.until = until;
    exports.waterfall = waterfall;
    exports.whilst = whilst;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
