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
/// <reference path="../_definitions.d.ts" />
function isProgressPromise(p) {
    return "progress" in p;
}
function createProgressFunction(p) {
    return function (val) {
        var cbs = p._progressesCallbacks, len = cbs.length;
        for (var i = 0; i < len; i++) {
            cbs[i].call(undefined, val);
        }
        p._progress = val;
    };
}
function initAllProgresses(promises, progress) {
    var len = promises.length, progresses = new Array(len);
    var i = 0, p;
    for (; i < len; i++) {
        p = promises[i];
        progresses[i] = undefined;
        if (isProgressPromise(p)) {
            p.progress(initAllProgressFunction.bind(undefined, progress, progresses, i));
        }
    }
}
function initAllProgressFunction(progress, progresses, index, val) {
    progresses[index] = val;
    progress(progresses);
}
function cleaner() {
    this._progressesCallbacks = undefined;
}
var ProgressPromise = (function () {
    function ProgressPromise(executor) {
        var _this = this;
        this._progress = undefined;
        this._progressesCallbacks = [];
        if (!(this instanceof ProgressPromise)) {
            throw new TypeError("Failed to construct 'ProgressPromise': Please use the 'new' operator, this object constructor cannot be called as a function.");
        }
        this._innerPromise = new Promise(function (resolve, reject) {
            executor(resolve, reject, createProgressFunction(_this));
        });
        var clean = cleaner.bind(this);
        this._innerPromise.then(clean, clean);
    }
    ;
    ProgressPromise.prototype.progress = function (onProgress) {
        if (this._progressesCallbacks) {
            this._progressesCallbacks.push(onProgress);
        }
        if (typeof this._progress !== "undefined") {
            onProgress.call(undefined, this._progress);
        }
        return this;
    };
    ProgressPromise.prototype.then = function (onFulfilled, onRejected) {
        return this._innerPromise.then(onFulfilled, onRejected);
    };
    /**
     * The catch function allows to apply a callback on rejection handler.
     * It is equivalent to promise.then(undefined, onRejected)
     * @param {PromiseCallback} onRejected callback to be called whenever promise fail
     * @returns {Promise} A chained Promise which handle error and fullfil
     */
    ProgressPromise.prototype.catch = function (onRejected) {
        return this._innerPromise.catch(onRejected);
    };
    ProgressPromise.defer = function () {
        var def = {};
        def.promise = new ProgressPromise(function (res, rej, pro) {
            def.resolve = res;
            def.reject = rej;
            def.progress = pro;
        });
        return def;
    };
    ProgressPromise.all = function (promises) {
        return new ProgressPromise(function (resolve, reject, progress) {
            initAllProgresses(promises, progress);
            Promise.all(promises).then(resolve, reject);
        });
    };
    ProgressPromise.race = function (promises) {
        return new ProgressPromise(function (resolve, reject, progress) {
            initAllProgresses(promises, progress);
            Promise.race(promises).then(resolve, reject);
        });
    };
    return ProgressPromise;
})();
exports.ProgressPromise = ProgressPromise;

/// <reference path="../_definitions.d.ts" />
/**
 * Applies the function  iterator  to each item in  arr , in parallel.
 * The  iterator  is called with an item from the list, the index of this item and the list itself.
 * If the  iterator  emit a rejected Promise, the each function Promise result is instantly rejected.
 *
 * Note, that since this function applies  iterator  to each item in parallel, there is no guarantee that the iterator functions will complete in order.
 */
function each(array, iterator) {
    var promises = array.map(iterator);
    return Promise.all(promises).then(function () { return; });
}
exports.each = each;
/**
 * The same as  each , only  iterator  is applied to each item in  array  in series.
 * The next  iterator  is only called once the current one has completed.
 * This means the  iterator  functions will complete in order.
 */
function eachSeries(array, iterator) {
    return new Promise(function (resolve, reject) {
        var p = Promise.resolve(), i = 0, len = array.length;
        function partial(value, index) {
            return function () { return iterator(value, index, array); };
        }
        for (; i < len; i++) {
            p = p.then(partial(array[i], i));
        }
        return p.then(function () { return resolve(); }, reject);
    });
}
exports.eachSeries = eachSeries;
/**
 * Produces a new array of values by mapping each value in  array  through the  iterator  function.
 * The  iterator  is called with an item from the list, the index of this item and the list itself.
 * If the  iterator  emit a rejected Promise, the each function Promise result is instantly rejected.
 *
 * Note, that since this function applies the  iterator  to each item in parallel, there is no guarantee that the  iterator  functions will complete in order.
 * However, the results array will be in the same order as the original  arr .
 */
function map(array, iterator) {
    var promises = array.map(iterator);
    return Promise.all(promises);
}
exports.map = map;
/**
 * The same as  map , only the  iterator  is applied to each item in  array  in series.
 * The next  iterator  is only called once the current one has completed.
 * The results array will be in the same order as the original.
 */
function mapSeries(array, iterator) {
    var results = [];
    function mapper(item, index) {
        return iterator(item, index, array).then(function (result) {
            results[index] = result;
        });
    }
    return eachSeries(array, mapper).then(function () { return results; });
}
exports.mapSeries = mapSeries;
/**
 * Returns a new array of all the values in  array  which pass an async truth test.
 * The Promise returned by each  iterator  call can only returns boolean value!
 * This operation is performed in parallel, but the results array will be in the same order as the original.
 */
function filter(array, iterator) {
    var results = [], promises = array.map(function (value, index, list) { return iterator(value, index, list).then(function (include) {
        if (include) {
            results.push(value);
        }
    }); });
    return Promise.all(promises).then(function () { return results; });
}
exports.filter = filter;
/**
 * The same as  filter  only the  iterator  is applied to each item in  array  in series.
 * The next  iterator  is only called once the current one has completed.
 * The results array will be in the same order as the original.
 */
function filterSeries(array, iterator) {
    var results = [];
    function filterer(item, index) {
        return iterator(item, index, array).then(function (include) {
            if (include) {
                results.push(item);
            }
        });
    }
    return eachSeries(array, filterer).then(function () { return results; });
}
exports.filterSeries = filterSeries;
/**
 * The opposite of  filter . Removes values that pass an  async  truth test.
 */
function reject(array, iterator) {
    var results = [], promises = array.map(function (value, index, list) { return iterator(value, index, list).then(function (exclude) {
        if (!exclude) {
            results.push(value);
        }
    }); });
    return Promise.all(promises).then(function () { return results; });
}
exports.reject = reject;
/**
 * The same as  reject , only the  iterator  is applied to each item in  array  in series.
 */
function rejectSeries(array, iterator) {
    var results = [];
    function rejecter(item, index) {
        return iterator(item, index, array).then(function (exclude) {
            if (!exclude) {
                results.push(item);
            }
        });
    }
    return eachSeries(array, rejecter).then(function () { return results; });
}
exports.rejectSeries = rejectSeries;
/**
 * Reduces  array  into a single value using an async  iterator  to return each successive step.
 * memo  is the initial state of the reduction.
 * This function only operates in series.
 *
 * For performance reasons, it may make sense to split a call to this function into a parallel map,
 * and then use the normal  Array.prototype.reduce  on the results.
 *
 * This function is for situations where each step in the reduction needs to be async;
 * if you can get the data before reducing it, then it's probably a good idea to do so.
 */
function reduce(array, memo, iterator) {
    function reducer(item, index) {
        return iterator(memo, item).then(function (result) {
            memo = result;
        });
    }
    return eachSeries(array, reducer).then(function () { return memo; });
}
exports.reduce = reduce;
/**
 * Same as  reduce , only operates on  array  in reverse order.
 */
function reduceRight(array, memo, iterator) {
    var clone = [].concat(array).reverse();
    return reduce(clone, memo, iterator);
}
exports.reduceRight = reduceRight;
/**
 * Returns the first value in  array  that passes an async truth test.
 * The  iterator  is applied in parallel, meaning the first iterator to return  true  resolve the global  find  Promise.
 * That means the result might not be the first item in the original  array  (in terms of order) that passes the test.
 * If order within the original  array  is important, then look at  findSeries .
 */
function find(array, iterator) {
    var len = array.length;
    var count = 0;
    return new Promise(function (resolve, reject) {
        array.forEach(function (value, index, list) { return iterator(value, index, list).then(function (valid) {
            if (valid) {
                resolve(value);
            }
            else if (++count === len) {
                resolve();
            }
        }, reject); });
    });
}
exports.find = find;
/**
 * The same as  find , only the  iterator  is applied to each item in  array  in series.
 * This means the result is always the first in the original  array  (in terms of array order) that passes the truth test.
 */
function findSeries(array, iterator) {
    var last = array.length - 1;
    return new Promise(function (resolve, reject) {
        eachSeries(array, function (item, index, list) { return iterator(item, index, list).then(function (valid) {
            if (valid) {
                resolve(item);
            }
            else if (index === last) {
                resolve();
            }
        }, reject); });
    });
}
exports.findSeries = findSeries;
/**
 * Sorts a list by the results of running each  array  value through an async  iterator .
 */
function sortBy(array, iterator) {
    function sortMapper(item, index) {
        return iterator(item, index, array).then(function (res) {
            return {
                source: item,
                result: res
            };
        });
    }
    function sortFunction(left, right) {
        var a = left.result, b = right.result;
        return a < b ? -1 : a > b ? 1 : 0;
    }
    return map(array, sortMapper).then(function (result) { return result.sort(sortFunction).map(function (i) { return i.source; }); });
}
exports.sortBy = sortBy;
/**
 * Returns  true  if at least one element in the  array  satisfies an async test.
 * The Promise returned by each  iterator  call can only returns boolean value!
 * Once any iterator call returns  true , the main Promise is resolved.
 */
function some(array, iterator) {
    return find(array, iterator).then(function (result) { return !!result; });
}
exports.some = some;
/**
 * Returns  true  if every element in  array  satisfies an async test.
 */
function every(array, iterator) {
    var results = [], promises = array.map(function (value, index, list) { return iterator(value, index, list).then(function (ok) {
        if (!ok) {
            throw new Error("PROMIZR_NOTOK");
        }
    }); });
    return Promise.all(promises)
        .then(function () { return true; })
        .catch(function (err) {
        if (err.message !== "PROMIZR_NOTOK") {
            throw err;
        }
        return false;
    });
}
exports.every = every;
/**
 * Applies  iterator  to each item in  array , concatenating the results.
 * Returns the concatenated list.
 *
 * The  iterator s are called in parallel, and the results are concatenated as they return.
 * There is no guarantee that the results array will be returned in the original order of  array  passed to the  iterator  function.
 */
function concat(array, iterator) {
    return map(array, iterator)
        .then(function (results) { return Array.prototype.concat.apply([], results.filter(function (a) { return !!a; })); });
}
exports.concat = concat;
/**
 * Same as  concat , but executes in series instead of parallel.
 */
function concatSeries(array, iterator) {
    return mapSeries(array, iterator)
        .then(function (results) { return Array.prototype.concat.apply([], results.filter(function (a) { return !!a; })); });
}
exports.concatSeries = concatSeries;

/// <reference path="../_definitions.d.ts" />
var own = Object.prototype.hasOwnProperty;
function listSeries(array) {
    var p = Promise.resolve(), i = 0, len = array.length, results = [];
    function capture(index) {
        return array[index]().then(function (result) {
            results.push(result);
        });
    }
    for (; i < len; i++) {
        p = p.then(capture.bind(null, i));
    }
    return p.then(function () { return results; });
}
function objectSeries(obj) {
    var p = Promise.resolve(), results = {}, key;
    function capture(key) {
        return obj[key]().then(function (result) {
            results[key] = result;
        });
    }
    for (key in obj) {
        if (own.call(obj, key)) {
            p = p.then(capture.bind(null, key));
        }
    }
    return p.then(function () { return results; });
}
function series(tasks) {
    return Array.isArray(tasks) ?
        listSeries(tasks) :
        objectSeries(tasks);
}
exports.series = series;
function listParallel(array) {
    var promises = array.map(function (exec) { return exec(); });
    return Promise.all(promises);
}
function objectParallel(obj) {
    var promises = [], results = {}, key;
    function capture(key) {
        return obj[key]().then(function (result) {
            results[key] = result;
        });
    }
    for (key in obj) {
        if (own.call(obj, key)) {
            promises.push(capture(key));
        }
    }
    return Promise.all(promises).then(function () { return results; });
}
function parallel(tasks) {
    return Array.isArray(tasks) ?
        listParallel(tasks) :
        objectParallel(tasks);
}
exports.parallel = parallel;
function whilst(test, task) {
    function next() {
        if (test()) {
            return task().then(next);
        }
    }
    return Promise.resolve().then(next);
}
exports.whilst = whilst;
function doWhilst(executor, test) {
    function next() {
        return executor().then(function (res) {
            if (test(res)) {
                return next();
            }
        });
    }
    return Promise.resolve().then(next);
}
exports.doWhilst = doWhilst;
function until(test, task) {
    function next() {
        if (!test()) {
            return task().then(next);
        }
    }
    return Promise.resolve().then(next);
}
exports.until = until;
function doUntil(task, test) {
    function next() {
        return task().then(function (res) {
            if (!test(res)) {
                return next();
            }
        });
    }
    return Promise.resolve().then(next);
}
exports.doUntil = doUntil;
function forever(task) {
    function next() {
        return task().then(next);
    }
    return Promise.resolve().then(next);
}
exports.forever = forever;
function waterfall(tasks) {
    var p = Promise.resolve(), i = 0, len = tasks.length;
    for (; i < len; i++) {
        p = p.then(tasks[i]);
    }
    return p;
}
exports.waterfall = waterfall;
function compose() {
    var tasks = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        tasks[_i - 0] = arguments[_i];
    }
    return function () {
        var p = Promise.resolve(), last = tasks.pop(), self = this, args = arguments, i = tasks.length - 1;
        p = p.then(function () { return last.apply(self, args); });
        for (; i >= 0; i--) {
            p = p.then(tasks[i]);
        }
        return p;
    };
}
exports.compose = compose;
function seq() {
    var tasks = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        tasks[_i - 0] = arguments[_i];
    }
    return function () {
        var p = Promise.resolve(), first = tasks.shift(), self = this, args = arguments, i = 0, len = tasks.length;
        p = p.then(function () { return first.apply(self, args); });
        for (; i < len; i++) {
            p = p.then(tasks[i]);
        }
        return p;
    };
}
exports.seq = seq;
function applyEach(tasks) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    if (args.length > 0) {
        tasks = tasks.map(function (e) { return function () { return e.apply(null, args); }; });
        return parallel(tasks);
    }
    else {
        return function () {
            var _this = this;
            var args = arguments;
            tasks = tasks.map(function (e) { return function () { return e.apply(_this, args); }; });
            return parallel(tasks);
        };
    }
}
exports.applyEach = applyEach;
function applyEachSeries(tasks) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    if (args.length > 0) {
        tasks = tasks.map(function (e) { return function () { return e.apply(null, args); }; });
        return series(tasks);
    }
    else {
        return function () {
            var _this = this;
            var args = arguments;
            tasks = tasks.map(function (e) { return function () { return e.apply(_this, args); }; });
            return series(tasks);
        };
    }
}
exports.applyEachSeries = applyEachSeries;
function retry(times, task) {
    var promise;
    try {
        promise = Promise.resolve(task());
    }
    catch (e) {
        promise = Promise.reject(e);
    }
    return promise.catch(function (err) {
        if (times > 1) {
            return retry(times - 1, task);
        }
        throw err;
    });
}
exports.retry = retry;
function times(times, task) {
    var results = [], i = times;
    for (; i > 0; i--) {
        try {
            results.push(task());
        }
        catch (e) {
            results.push(Promise.reject(e));
        }
    }
    return Promise.all(results);
}
exports.times = times;
function timesSeries(times, task) {
    var p = Promise.resolve(), results = [], i = times;
    function capture() {
        return Promise.resolve(task()).then(function (result) { results.push(result); });
    }
    for (; i > 0; i--) {
        p = p.then(capture);
    }
    return p.then(function () { return results; });
}
exports.timesSeries = timesSeries;

/// <reference path="../_definitions.d.ts" />
var nextTick = (function () {
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
    else if (typeof Uint8ClampedArray !== "undefined" && typeof importScripts !== "undefined" && typeof MessageChannel !== "undefined") {
        var channel = new MessageChannel();
        return function (cb) {
            channel.port1.onmessage = cb;
            channel.port2.postMessage(0);
        };
    }
    else {
        var win = (typeof window !== "undefined") ? window : {}, tempCallbacks = [], canUsePostMessage = function canUsePostMessage() {
            // The test against `importScripts` prevents this implementation from being installed inside a web worker,
            // where `global.postMessage` means something completely different and can"t be used for this purpose.
            if (win.postMessage && !win.importScripts) {
                var postMessageIsAsynchronous = true, oldOnMessage = win.onmessage;
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
            var iterations = 0, node = document.createTextNode(""), observer = new win.MutationObserver(function () {
                var cb;
                while ((cb = tempCallbacks.shift()) || tempCallbacks.length) {
                    cb();
                }
            });
            observer.observe(node, { characterData: true });
            return function (cb) {
                tempCallbacks.push(cb);
                node.data = (iterations = ++iterations % 2);
            };
        }
        else if (canUsePostMessage()) {
            var messagePrefix = "setImmediate$" + Math.random() + "$", onGlobalMessage = function (event) {
                if (event.source === win &&
                    typeof event.data === "string" &&
                    event.data.indexOf(messagePrefix) === 0) {
                    var cb;
                    while ((cb = tempCallbacks.shift()) || tempCallbacks.length) {
                        cb();
                    }
                }
            };
            if (win.addEventListener) {
                win.addEventListener("message", onGlobalMessage, false);
            }
            else {
                win.attachEvent("onmessage", onGlobalMessage);
            }
            return function (cb) {
                tempCallbacks.push(cb);
                win.postMessage(messagePrefix + Math.random() * 1000, "*");
            };
        }
        else {
            return function (cb) {
                setTimeout(cb, 1);
            };
        }
    }
}());

/// <reference path="../_definitions.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Queue = (function () {
    function Queue(worker, limit, list) {
        if (limit === void 0) { limit = 1; }
        this.worker = worker;
        this.limit = limit;
        this.items = [];
        this.workers = 0;
        this.started = false;
        this.paused = false;
        this.hasException = false;
        this.stopOnError = false;
        this.waitToReject = false;
        this.process = this.process.bind(this);
        if (list && list.length > 0) {
            this.push(list);
        }
    }
    Queue.prototype.push = function () {
        var datas = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            datas[_i - 0] = arguments[_i];
        }
        if (datas.length === 1 && Array.isArray(datas[0])) {
            datas = datas[0];
        }
        return this.insert(datas);
    };
    Queue.prototype.unshift = function () {
        var datas = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            datas[_i - 0] = arguments[_i];
        }
        if (datas.length === 1 && Array.isArray(datas[0])) {
            datas = datas[0];
        }
        return this.insert(datas, true);
    };
    Queue.prototype.length = function () {
        return this.items.length;
    };
    Queue.prototype.running = function () {
        return this.workers > 0;
    };
    Queue.prototype.idle = function () {
        return this.items.length + this.workers === 0;
    };
    Queue.prototype.pause = function () {
        if (this.paused) {
            return;
        }
        this.paused = true;
    };
    Queue.prototype.resume = function () {
        if (!this.paused || !this.hasException) {
            return;
        }
        this.paused = false;
        this.hasException = false;
        var i = 0, len = this.limit, process = this.process.bind(this);
        for (; i < len; i++) {
            nextTick(process);
        }
    };
    Queue.prototype.clear = function () {
        this.ondrain = null;
        this.items = [];
    };
    Queue.prototype.insert = function (datas, before) {
        var resolver, rejecter;
        var promise = new Promise(function (res, rej) { resolver = res; rejecter = rej; }), length = datas.length, errors = [], results = [];
        if (length === 0) {
            return Promise.resolve([]);
        }
        if (!this.started) {
            this.started = true;
        }
        function capture(data) {
            nextTick(this.process);
            return this.createItem(data, results, errors, length, resolver, rejecter);
        }
        if (before) {
            this.items.unshift.apply(this.items, datas.map(capture, this));
        }
        else {
            this.items.push.apply(this.items, datas.map(capture, this));
        }
        if (this.onsaturated && this.items.length >= this.limit) {
            this.onsaturated();
        }
        return promise;
    };
    Queue.prototype.createItem = function (data, results, errors, count, resolve, reject) {
        var _this = this;
        return {
            data: data,
            resolver: function (res) {
                results.push(res);
                if (results.length === count) {
                    resolve(count === 1 ? results[0] : results);
                }
            },
            rejecter: function (err) {
                if (!_this.waitToReject) {
                    return reject(err);
                }
                errors.push(err);
                if (errors.length + results.length === count) {
                    var error = new Error("Queue worker exception");
                    count === 1 ?
                        error.innerException = errors[0] :
                        error.innerExceptions = errors;
                    reject(error);
                }
            }
        };
    };
    Queue.prototype.process = function () {
        var _this = this;
        if (!this.paused && this.workers < this.limit && this.items.length > 0 && !(this.stopOnError && this.hasException)) {
            var item = this.items.shift();
            if (this.onempty && this.items.length === 0) {
                this.onempty();
            }
            this.workers += 1;
            Promise.resolve(this.worker(item.data)).then(function (res) {
                item.resolver.call(undefined, res);
                _this.onProcessEnd();
            }, function (err) {
                item.rejecter.call(undefined, err);
                _this.hasException = true;
                _this.onProcessEnd();
            });
        }
    };
    Queue.prototype.onProcessEnd = function () {
        this.workers -= 1;
        if (this.ondrain && this.items.length + this.workers === 0) {
            this.ondrain();
        }
        this.process();
    };
    return Queue;
})();
exports.Queue = Queue;
var PriorityQueue = (function (_super) {
    __extends(PriorityQueue, _super);
    function PriorityQueue(worker, limit, list) {
        _super.call(this, worker, limit, list);
        this.defaultPriority = 1;
    }
    PriorityQueue.prototype.push = function () {
        var datas = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            datas[_i - 0] = arguments[_i];
        }
        var priority = this.defaultPriority;
        if (typeof datas[0] === "number") {
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
            datas[_i - 0] = arguments[_i];
        }
        var priority = this.defaultPriority;
        if (typeof datas[0] === "number") {
            priority = datas.shift();
        }
        if (datas.length === 1 && Array.isArray(datas[0])) {
            datas = datas[0];
        }
        return this.insertAt(datas, priority);
    };
    PriorityQueue.prototype.insertAt = function (datas, priority) {
        var length = datas.length;
        if (length === 0) {
            return Promise.resolve([]);
        }
        var resolver, rejecter;
        var promise = new Promise(function (res, rej) { resolver = res; rejecter = rej; }), errors = [], results = [], index = this.binarySearch(this.items, { priority: priority }, this.compareTasks) + 1;
        if (!this.started) {
            this.started = true;
        }
        function capture(data) {
            var item = this.createItem(data, results, errors, length, resolver, rejecter);
            item.priority = priority;
            nextTick(this.process);
            return item;
        }
        this.items.splice.apply(this.items, [index, 0].concat(datas.map(capture, this)));
        if (this.onsaturated && this.items.length >= this.limit) {
            this.onsaturated();
        }
        return promise;
    };
    PriorityQueue.prototype.binarySearch = function (seq, item, compare) {
        var beg = -1, end = seq.length - 1, mid;
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
        return a.priority - b.priority;
    };
    return PriorityQueue;
})(Queue);
exports.PriorityQueue = PriorityQueue;
var TaskQueue = (function (_super) {
    __extends(TaskQueue, _super);
    function TaskQueue(limit, list) {
        _super.call(this, function (item) { return item(); }, limit, list);
    }
    return TaskQueue;
})(Queue);
exports.TaskQueue = TaskQueue;
var PriorityTaskQueue = (function (_super) {
    __extends(PriorityTaskQueue, _super);
    function PriorityTaskQueue(limit, list) {
        _super.call(this, function (item) { return item(); }, limit, list);
    }
    return PriorityTaskQueue;
})(PriorityQueue);
exports.PriorityTaskQueue = PriorityTaskQueue;
function queue(worker, limit, list) {
    return new Queue(worker, limit, list);
}
exports.queue = queue;
function priorityQueue(worker, limit, list) {
    return new PriorityQueue(worker, limit, list);
}
exports.priorityQueue = priorityQueue;
function taskQueue(limit, list) {
    return new TaskQueue(limit, list);
}
exports.taskQueue = taskQueue;
function priorityTaskQueue(limit, list) {
    return new PriorityTaskQueue(limit, list);
}
exports.priorityTaskQueue = priorityTaskQueue;
function eachLimit(array, limit, iterator) {
    var iterators = array.map(function (value, index, list) { return function () { return iterator(value, index, list); }; });
    return taskQueue(limit).push(iterators).then(function () { return; });
}
exports.eachLimit = eachLimit;
function mapLimit(array, limit, iterator) {
    var iterators = array.map(function (value, index, list) { return function () { return iterator(value, index, list); }; });
    return taskQueue(limit).push(iterators);
}
exports.mapLimit = mapLimit;
function parallelLimit(tasks, limit) {
    if (Array.isArray(tasks)) {
        return taskQueue(limit).push(tasks);
    }
    var obj = tasks, data = Object.keys(obj), result = {};
    function worker(key) {
        return obj[key]().then(function (res) {
            result[key] = res;
        });
    }
    return queue(worker, limit).push(data).then(function () { return result; });
}
exports.parallelLimit = parallelLimit;

/// <reference path="../_definitions.d.ts" />
function apply(task) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return function () {
        return task.apply(null, args);
    };
}
exports.apply = apply;
function applyOn(owner, task) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return function () {
        if (typeof task === "string") {
            return owner[task].apply(owner, args);
        }
        else {
            return task.apply(owner, args);
        }
    };
}
exports.applyOn = applyOn;
function partial(task) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return function () {
        return task.apply(null, args.concat(arguments));
    };
}
exports.partial = partial;
function partialOn(owner, task) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return function () {
        if (typeof task === "string") {
            return owner[task].apply(owner, args.concat(arguments));
        }
        else {
            return task.apply(owner, args.concat(arguments));
        }
    };
}
exports.partialOn = partialOn;
function tap(task) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return function (result) {
        task.apply(null, args);
        return result;
    };
}
exports.tap = tap;
function tapOn(owner, task) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return function (result) {
        if (typeof task === "string") {
            owner[task].apply(owner, args);
        }
        else {
            task.apply(owner, args);
        }
        return result;
    };
}
exports.tapOn = tapOn;
function memoize(task, hash) {
    var cache, haveToHash = typeof hash !== "undefined", hasher;
    if (haveToHash) {
        cache = {};
        if (typeof hash === "function") {
            hasher = hash;
        }
        else {
            hasher = JSON.stringify;
        }
    }
    function save(hashed, value) {
        if (haveToHash) {
            cache[hashed] = value;
        }
        else {
            cache = value;
        }
    }
    function result() {
        var args = Array.prototype.slice.apply(arguments), hashed, cached;
        if (haveToHash) {
            hashed = hasher(args);
            cached = cache[hashed];
        }
        else {
            cached = cache;
        }
        if (cached) {
            return Promise.resolve(cached);
        }
        cached = task.apply(null, arguments).then(function (res) {
            save(hashed, res);
            return res;
        });
        save(hashed, cached);
        return cached;
    }
    return result;
}
exports.memoize = memoize;
function log(task) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return task.apply(null, args).then(function (result) { console.log(result); return result; }, function (err) { console.error(err); throw err; });
}
exports.log = log;
function dir(task) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return task.apply(null, args).then(function (result) { console.dir(result); return result; }, function (err) { console.error(err); throw err; });
}
exports.dir = dir;
function timeout(ms) {
    return new Promise(function (resolve) {
        setTimeout(function () { resolve.call(null); }, ms || 1);
    });
}
exports.timeout = timeout;
function immediate() {
    return new Promise(function (resolve) { nextTick(resolve); });
}
exports.immediate = immediate;
function module() {
    var args = Array.prototype.slice.call(arguments);
    if (args.length === 0) {
        return Promise.resolve();
    }
    return new Promise(function (resolve, reject) {
        if (args.length === 1 && Array.isArray(args[0])) {
            args = args[0];
        }
        try {
            require(args, function () {
                var mods = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    mods[_i - 0] = arguments[_i];
                }
                resolve(mods.length === 1 ? mods[0] : mods);
            }, function (err) { reject(err); });
        }
        catch (e) {
            reject(e);
        }
    });
}
exports.module = module;
function denodify() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    var fn = args[1], owner = args[0];
    if (typeof owner === "function" && typeof fn !== "function") {
        fn = owner;
        owner = null;
    }
    return new Promise(function (resolve, reject) {
        function callback(err) {
            if (err) {
                return reject(err);
            }
            var result = Array.prototype.slice.call(arguments, 1);
            if (result.length === 1) {
                result = result[0];
            }
            resolve(result);
        }
        fn.call(owner, args.concat([callback]));
    });
}
exports.denodify = denodify;
function uncallbackify() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    var fn = args[1], owner = args[0];
    if (typeof owner === "function" && typeof fn !== "function") {
        fn = owner;
        owner = null;
    }
    return new Promise(function (resolve, reject) {
        function success() {
            var result = Array.prototype.slice.call(arguments, 0);
            if (result.length === 1) {
                result = result[0];
            }
            resolve(result);
        }
        function error() {
            var err = Array.prototype.slice.call(arguments, 0);
            if (err.length === 1) {
                err = err[0];
            }
            if (!(err instanceof Error)) {
                err = new Error(err.toString());
                err.innerError = err;
            }
            reject(err);
        }
        fn.call(owner, args.concat([success, error]));
    });
}
exports.uncallbackify = uncallbackify;
function defer() {
    var dfd = { resolve: null, reject: null, promise: null };
    dfd.promise = new Promise(function (resolve, reject) {
        dfd.resolve = resolve;
        dfd.reject = reject;
    });
    return dfd;
}
exports.defer = defer;
;
function polyfill() {
    if (typeof process === "undefined" || {}.toString.call(process) !== "[object process]") {
        throw new Error("This method is only available in Node.JS environment");
    }
    return require("./polyfill");
}
exports.polyfill = polyfill;

}));
