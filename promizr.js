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
function each(array, iterator) {
    var promises = array.map(iterator);
    return Promise.all(promises).then(function () {
        return;
    });
}
exports.each = each;
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
function map(array, iterator) {
    var promises = array.map(iterator);
    return Promise.all(promises);
}
exports.map = map;
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
function filter(array, iterator) {
    var results = [], promises = array.map(function (value, index, list) { return iterator(value, index, list).then(function (include) {
        if (include) {
            results.push(value);
        }
    }); });
    return Promise.all(promises).then(function () { return results; });
}
exports.filter = filter;
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
function reject(array, iterator) {
    var results = [], promises = array.map(function (value, index, list) { return iterator(value, index, list).then(function (exclude) {
        if (!exclude) {
            results.push(value);
        }
    }); });
    return Promise.all(promises).then(function () { return results; });
}
exports.reject = reject;
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
function reduce(array, memo, iterator) {
    function reducer(item, index) {
        return iterator(memo, item).then(function (result) {
            memo = result;
        });
    }
    return eachSeries(array, reducer).then(function () { return memo; });
}
exports.reduce = reduce;
function reduceRight(array, memo, iterator) {
    var clone = [].concat(array).reverse();
    return reduce(clone, memo, iterator);
}
exports.reduceRight = reduceRight;
function find(array, iterator) {
    var resolvers = [];
    var promises = array.map(function (value, index, list) { return iterator(value, index, list).then(function (valid) {
        if (!valid) {
            return new Promise(function (resolve, reject) {
                if (resolvers.length === array.length - 1) {
                    reject("PROMIZR_NOTFOUND");
                }
                else {
                    resolvers.push(resolve);
                }
            });
        }
        return value;
    }); });
    return Promise.race(promises).catch(function (err) {
        if (err !== "PROMIZR_NOTFOUND") {
            throw err;
        }
    }).then(function (result) {
        while (resolvers.length) {
            resolvers.pop().call(null);
        }
        return result;
    });
}
exports.find = find;
function findSeries(array, iterator) {
    function finder(item, index) {
        return iterator(item, index, array).then(function (ok) {
            if (ok) {
                return Promise.reject({ success: true, data: item });
            }
        });
    }
    return eachSeries(array, finder).catch(function (err) {
        if (!err.success) {
            throw err;
        }
        return err.data;
    });
}
exports.findSeries = findSeries;
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
function some(array, iterator) {
    return find(array, iterator).then(function (result) { return !!result; });
}
exports.some = some;
function every(array, iterator) {
    var results = [], promises = array.map(function (value, index, list) { return iterator(value, index, list).then(function (ok) {
        if (!ok) {
            throw new Error("PROMIZR_NOTOK");
        }
    }); });
    return Promise.all(promises).then(function () { return true; }).catch(function (err) {
        if (err.message !== "PROMIZR_NOTOK") {
            throw err;
        }
        return false;
    });
}
exports.every = every;
function concat(array, iterator) {
    return map(array, iterator).then(function (results) { return Array.prototype.concat.apply([], results.filter(function (a) { return !!a; })); });
}
exports.concat = concat;
function concatSeries(array, iterator) {
    return mapSeries(array, iterator).then(function (results) { return Array.prototype.concat.apply([], results.filter(function (a) { return !!a; })); });
}
exports.concatSeries = concatSeries;

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
        if (obj.hasOwnProperty(key)) {
            p = p.then(capture.bind(null, key));
        }
    }
    return p.then(function () { return results; });
}
function series(tasks) {
    return Array.isArray(tasks) ? listSeries(tasks) : objectSeries(tasks);
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
        if (obj.hasOwnProperty(key)) {
            promises.push(capture(key));
        }
    }
    return Promise.all(promises).then(function () { return results; });
}
function parallel(tasks) {
    return Array.isArray(tasks) ? listParallel(tasks) : objectParallel(tasks);
}
exports.parallel = parallel;
function parallelLimit(tasks, limit) {
    return Promise.reject("not implemented");
}
exports.parallelLimit = parallelLimit;
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
function forever(tasks) {
    function next() {
        return tasks().then(next);
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
        var p = tasks.pop().apply(this, arguments), i = tasks.length - 1;
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
        var p = tasks.shift().apply(this, arguments), i = 0, len = tasks.length;
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
        tasks = tasks.map(function (e) { return e.bind.apply(e, [null].concat(args)); });
        return parallel(tasks);
    }
    else {
        return function () {
            var _this = this;
            tasks = tasks.map(function (e) { return e.bind.apply(e, [_this].concat(arguments)); });
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
        tasks = tasks.map(function (e) { return e.bind.apply(e, [null].concat(args)); });
        return series(tasks);
    }
    else {
        return function () {
            var _this = this;
            tasks = tasks.map(function (e) { return e.bind.apply(e, [_this].concat(arguments)); });
            return series(tasks);
        };
    }
}
exports.applyEachSeries = applyEachSeries;
function retry(times, task) {
    var retries = 0;
    return task().catch(function (err) {
        if (retries++ < times) {
            return task();
        }
        throw err;
    });
}
exports.retry = retry;
function times(times, task) {
    var results = [], i = times;
    for (; i > 0; i--) {
        results.push(task());
    }
    return Promise.all(results);
}
exports.times = times;
function timesSeries(times, task) {
    var p = Promise.resolve(), results = [], i = times;
    function capture() {
        return task().then(function (result) {
            results.push(result);
        });
    }
    for (; i > 0; i--) {
        p = p.then(capture);
    }
    return p.then(function () { return results; });
}
exports.timesSeries = timesSeries;

exports.nextTick = (function () {
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
        var win = (typeof window !== "undefined") ? window : {}, tempCallback, canUsePostMessage = function canUsePostMessage() {
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
        if (win.MutationObserver || win.WebKitMutationObserver) {
            win.MutationObserver = win.MutationObserver || win.WebKitMutationObserver;
            var iterations = 0, node = document.createTextNode(""), observer = new win.MutationObserver(function () {
                tempCallback && tempCallback();
                tempCallback = null;
            });
            observer.observe(node, { characterData: true });
            return function (cb) {
                tempCallback = cb;
                node.data = (iterations = ++iterations % 2);
            };
        }
        else if (canUsePostMessage()) {
            var messagePrefix = "setImmediate$" + Math.random() + "$", onGlobalMessage = function (event) {
                if (event.source === win && typeof event.data === "string" && event.data.indexOf(messagePrefix) === 0 && tempCallback) {
                    tempCallback();
                    tempCallback = null;
                }
            };
            if (win.addEventListener) {
                win.addEventListener("message", onGlobalMessage, false);
            }
            else {
                win.attachEvent("onmessage", onGlobalMessage);
            }
            return function (cb) {
                tempCallback = cb;
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

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Queue = (function () {
    function Queue(worker, limit, list) {
        this.items = [];
        this.limit = 1;
        this.workers = 0;
        this.started = false;
        this.paused = false;
        if (limit) {
            this.limit = limit;
        }
        this.worker = worker;
        if (list && list.length > 0) {
            this.push.apply(this, list);
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
        if (!this.paused) {
            return;
        }
        this.paused = false;
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
        var resolver, promise = new Promise(function (r) {
            resolver = r;
        }), results = [], process = this.process.bind(this);
        if (datas.length === 0) {
            return Promise.resolve([]);
        }
        if (!this.started) {
            this.started = true;
        }
        function capture(data) {
            nextTick(process);
            return {
                data: data,
                resolver: function (res) {
                    results.push(res);
                    if (results.length === datas.length) {
                        resolver(results.length === 1 ? results[0] : results);
                    }
                }
            };
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
    Queue.prototype.process = function () {
        var _this = this;
        if (!this.paused && this.workers < this.limit && this.items.length > 0) {
            var item = this.items.shift();
            if (this.onempty && this.items.length === 0) {
                this.onempty();
            }
            this.workers += 1;
            this.worker(item.data).then(function (res) {
                _this.workers -= 1;
                item.resolver.call(null, res);
                if (_this.ondrain && _this.items.length + _this.workers === 0) {
                    _this.ondrain();
                }
                _this.process();
            });
        }
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
        if (datas.length === 0) {
            return Promise.resolve([]);
        }
        var resolver, promise = new Promise(function (r) {
            resolver = r;
        }), results = [], process = this.process.bind(this), index = this.binarySearch(this.items, { priority: priority }, this.compareTasks) + 1;
        if (!this.started) {
            this.started = true;
        }
        function capture(data) {
            nextTick(process);
            return {
                priority: priority,
                data: data,
                resolver: function (res) {
                    results.push(res);
                    if (results.length === datas.length) {
                        resolver(results.length === 1 ? results[0] : results);
                    }
                }
            };
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
    return taskQueue(limit).push(iterators).then(function () {
        return;
    });
}
exports.eachLimit = eachLimit;
function mapLimit(array, limit, iterator) {
    var iterators = array.map(function (value, index, list) { return function () { return iterator(value, index, list); }; });
    return taskQueue(limit).push(iterators);
}
exports.mapLimit = mapLimit;

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
    return task.apply(null, args).then(function (result) {
        console.log(result);
        return result;
    }, function (err) {
        console.error(err);
        throw err;
    });
}
exports.log = log;
function dir(task) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return task.apply(null, args).then(function (result) {
        console.dir(result);
        return result;
    }, function (err) {
        console.error(err);
        throw err;
    });
}
exports.dir = dir;
function timeout(ms) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve.call(null);
        }, ms || 1);
    });
}
exports.timeout = timeout;
function immediate() {
    return new Promise(function (resolve) {
        nextTick(resolve);
    });
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
            }, function (err) {
                reject(err);
            });
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
