(function (root, factory) {
    if (typeof exports === "object") {
        // CommonJS
        module.exports = factory(typeof global !== "undefined" ? global : root);
    } else if (typeof define === "function" && define.amd) {
        // AMD
        define(function () { return factory(root); });
    } else {
        // Global Variables
        factory(root);
    }
}(this, function (root) {
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_import,module,exports){
var status = _import("./status");
var tasks = _import("./tasks");
var utils = _import("./utils");
function createRejectFunction(promise) {
    return function (reason) {
        if (promise._status !== status.unresolved) {
            return;
        }
        var reactions = promise._rejectReactions;
        promise._result = reason;
        promise._rejectReactions = undefined;
        promise._resolveReactions = undefined;
        promise._status = status.rejected;
        return triggerPromiseReaction(reactions, reason);
    };
}
exports.createRejectFunction = createRejectFunction;
function createResolveFunction(promise) {
    return function (resolution) {
        if (promise._status !== status.unresolved) {
            return;
        }
        var reactions = promise._resolveReactions;
        promise._result = resolution;
        promise._rejectReactions = undefined;
        promise._resolveReactions = undefined;
        promise._status = status.resolved;
        return triggerPromiseReaction(reactions, resolution);
    };
}
exports.createResolveFunction = createResolveFunction;
function createResolutionHandlerFunction(promise, onFulfilled, onRejected) {
    return function (resolution) {
        if (resolution === promise) {
            var err = new TypeError("Handler result cannot be same promise as input");
            return onRejected.call(undefined, err);
        }
        var ctor = promise.constructor, capability = newPromiseCapability(ctor);
        if (updatePromiseFromPotentialThenable(resolution, capability)) {
            return utils.invoke(capability.promise, "then", [onFulfilled, onRejected]);
        }
        return onFulfilled.call(undefined, resolution);
    };
}
exports.createResolutionHandlerFunction = createResolutionHandlerFunction;
function newPromiseCapability(Ctor) {
    if (!utils.isConstructor(Ctor)) {
        throw new TypeError("newPromiseCapability only accept a constructor as argument");
    }
    var capability = { promise: undefined, resolve: undefined, reject: undefined };
    capability.promise = new Ctor(function (resolve, reject) {
        capability.resolve = resolve;
        capability.reject = reject;
    });
    if (!utils.isCallable(capability.resolve)) {
        throw new TypeError("Given constructor type does not provide an acceptable resolve function");
    }
    if (!utils.isCallable(capability.reject)) {
        throw new TypeError("Given constructor type does not provide an acceptable reject function");
    }
    return capability;
}
exports.newPromiseCapability = newPromiseCapability;
function isPromise(x) {
    return utils.isObject(x) && !utils.isUndefined(x._status);
}
exports.isPromise = isPromise;
function triggerPromiseReaction(reactions, value) {
    var i = 0, len = reactions.length, reaction;
    for (; i < len; i++) {
        reaction = reactions[i];
        tasks.enqueue(PromiseReactionTask, [reaction, value]);
    }
}
exports.triggerPromiseReaction = triggerPromiseReaction;
function updatePromiseFromPotentialThenable(value, capability) {
    try {
        if (utils.isObject(value) && utils.isCallable(value.then)) {
            value.then.call(value, capability.resolve, capability.reject);
            return true;
        }
    }
    catch (e) {
        capability.reject.call(null, e);
        return true;
    }
    return false;
}
exports.updatePromiseFromPotentialThenable = updatePromiseFromPotentialThenable;
function PromiseReactionTask(reaction, value) {
    if (!reaction || !reaction.capability || !reaction.handler) {
        throw new TypeError("PromiseReactionTask take a promise reaction record as first argument");
    }
    var capability = reaction.capability, handler = reaction.handler, handlerResult;
    try {
        handlerResult = handler.call(undefined, value);
    }
    catch (e) {
        return capability.reject.call(undefined, e);
    }
    if (handlerResult === capability.promise) {
        var err = new TypeError("Handler result cannot be same promise as input");
        return capability.reject.call(undefined, err);
    }
    if (!updatePromiseFromPotentialThenable(handlerResult, capability)) {
        return capability.resolve.call(undefined, handlerResult);
    }
}
exports.PromiseReactionTask = PromiseReactionTask;

},{"./status":4,"./tasks":5,"./utils":6}],2:[function(_import,module,exports){
var abstract = _import("./abstract");
var status = _import("./status");
var tasks = _import("./tasks");
var utils = _import("./utils");
var Promise = (function () {
    function Promise(executor) {
        this._status = status.waiting;
        if (!utils.isCallable(executor)) {
            throw new TypeError("You must pass a resolver function as the first argument to the promise constructor");
        }
        if (!(this instanceof Promise)) {
            throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
        }
        this._status = status.unresolved;
        this._resolveReactions = [];
        this._rejectReactions = [];
        var resolve = abstract.createResolveFunction(this), reject = abstract.createRejectFunction(this);
        try {
            executor(resolve, reject);
        }
        catch (e) {
            reject.call(undefined, e);
        }
    }
    Promise.prototype.then = function (onFulfilled, onRejected) {
        var self = this, ctor = this.constructor, capability = abstract.newPromiseCapability(ctor);
        if (!utils.isCallable(onRejected)) {
            onRejected = utils.thrower;
        }
        if (!utils.isCallable(onFulfilled)) {
            onFulfilled = utils.identity;
        }
        var resolveReaction = { capability: capability, handler: abstract.createResolutionHandlerFunction(self, onFulfilled, onRejected) }, rejectReaction = { capability: capability, handler: onRejected };
        if (this._status === status.unresolved) {
            this._resolveReactions.push(resolveReaction);
            this._rejectReactions.push(rejectReaction);
        }
        else if (this._status === status.resolved) {
            tasks.enqueue(abstract.PromiseReactionTask, [resolveReaction, self._result]);
        }
        else if (this._status === status.rejected) {
            tasks.enqueue(abstract.PromiseReactionTask, [rejectReaction, self._result]);
        }
        return capability.promise;
    };
    Promise.prototype.catch = function (onRejected) {
        return this.then(undefined, onRejected);
    };
    Promise.resolve = function (value) {
        var ctor = this, capability = abstract.newPromiseCapability(ctor);
        capability.resolve.call(undefined, value);
        return capability.promise;
    };
    Promise.reject = function (reason) {
        var ctor = this, capability = abstract.newPromiseCapability(ctor);
        capability.reject.call(undefined, reason);
        return capability.promise;
    };
    Promise.all = function (promises) {
        var ctor = this, capability = abstract.newPromiseCapability(ctor), values = [], remaining = 0, len = promises.length, i = 0, promise;
        if (len === 0) {
            capability.resolve.call(undefined, values);
            return capability.promise;
        }
        function createResolveElement(index) {
            return function (value) {
                values[index] = value;
                remaining--;
                if (remaining === 0) {
                    capability.resolve.call(undefined, values);
                }
            };
        }
        for (; i < len; i++) {
            promise = promises[i];
            try {
                promise = utils.invoke(ctor, "resolve", [promise]);
                utils.invoke(promise, "then", [createResolveElement(i), capability.reject]);
            }
            catch (e) {
                capability.reject.call(undefined, e);
                return capability.promise;
            }
            remaining++;
        }
        return capability.promise;
    };
    Promise.race = function (promises) {
        var ctor = this, capability = abstract.newPromiseCapability(ctor), i = 0, len = promises.length, promise;
        for (; i < len; i++) {
            promise = promises[i];
            try {
                promise = utils.invoke(ctor, "resolve", [promise]);
                utils.invoke(promise, "then", [capability.resolve, capability.reject]);
            }
            catch (e) {
                capability.reject.call(undefined, e);
                return capability.promise;
            }
        }
        return capability.promise;
    };
    return Promise;
})();
module.exports = Promise;

},{"./abstract":1,"./status":4,"./tasks":5,"./utils":6}],3:[function(_import,module,exports){
function isWellImplemented(P) {
    var resolve;
    new P(function (r) {
        resolve = r;
    });
    return (typeof resolve === "function");
}
function hasPromise(P) {
    return P && "resolve" in P && "reject" in P && "all" in P && "race" in P && isWellImplemented(P);
}
if (!hasPromise(root.Promise)) {
    root.Promise = _import("./class");
}

},{"./class":2}],4:[function(_import,module,exports){
exports.waiting = undefined;
exports.unresolved = "unresolved";
exports.resolved = "has-resolution";
exports.rejected = "has-rejection";

},{}],5:[function(_import,module,exports){
var len = 0, queue = new Array(1000), undef;
function flush() {
    for (var i = 0; i < len; i += 2) {
        var callback = queue[i], args = queue[i + 1];
        callback.apply(null, args);
        queue[i] = undef;
        queue[i + 1] = undef;
    }
    len = 0;
}
var scheduleFlush = (function () {
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
    else if (typeof Uint8ClampedArray !== "undefined" && typeof importScripts !== "undefined" && typeof MessageChannel !== "undefined") {
        var channel = new MessageChannel();
        channel.port1.onmessage = flush;
        return function () {
            channel.port2.postMessage(0);
        };
    }
    else {
        var win = (typeof window !== "undefined") ? window : {}, canUsePostMessage = function canUsePostMessage() {
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
            var iterations = 0, observer = new win.MutationObserver(flush), node = document.createTextNode("");
            observer.observe(node, { characterData: true });
            return function () {
                node.data = (iterations = ++iterations % 2);
            };
        }
        else if (canUsePostMessage()) {
            var messagePrefix = "setImmediate$" + Math.random() + "$", onGlobalMessage = function (event) {
                if (event.source === win && typeof event.data === "string" && event.data.indexOf(messagePrefix) === 0) {
                    flush();
                }
            };
            if (win.addEventListener) {
                win.addEventListener("message", onGlobalMessage, false);
            }
            else {
                win.attachEvent("onmessage", onGlobalMessage);
            }
            return function () {
                win.postMessage(messagePrefix + Math.random() * 1000, "*");
            };
        }
        else {
            return function () {
                setTimeout(flush, 1);
            };
        }
    }
}());
function clear() {
    for (var i = 0; i < len; i++) {
        queue[i] = undef;
    }
    len = 0;
}
exports.clear = clear;
function enqueue(callback, args) {
    queue[len] = callback;
    queue[len + 1] = args;
    len += 2;
    if (len === 2) {
        scheduleFlush();
    }
}
exports.enqueue = enqueue;

},{}],6:[function(_import,module,exports){
function isCallable(value) {
    return typeof value === "function";
}
exports.isCallable = isCallable;
function isObject(value) {
    return (typeof value === "object" && value !== null);
}
exports.isObject = isObject;
function isConstructor(value) {
    return (isCallable(value) && value.prototype && value.prototype.constructor === value);
}
exports.isConstructor = isConstructor;
function isUndefined(value) {
    return typeof value === "undefined";
}
exports.isUndefined = isUndefined;
function hasProperty(obj, prop) {
    return (prop in obj);
}
exports.hasProperty = hasProperty;
function invoke(obj, fn, args) {
    if (args === void 0) { args = []; }
    if (!hasProperty(obj, fn) || !isCallable(obj[fn])) {
        throw new TypeError("Object has no " + fn + " function");
    }
    return obj[fn].apply(obj, args);
}
exports.invoke = invoke;
function identity(value) {
    return value;
}
exports.identity = identity;
function thrower(e) {
    if (!(e instanceof Error)) {
        e = new Error(e);
    }
    throw e;
}
exports.thrower = thrower;

},{}]},{},[3]);


return root.Promise;
}));
