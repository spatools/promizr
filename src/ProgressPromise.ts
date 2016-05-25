/// <reference path="../_definitions.d.ts" />

export interface ProgressPromiseCallback<P> {
    (val: P): void;
}

export interface ProgressPromiseExecutor<T, P> {
    (resolve: (val?: T | PromiseLike<T>) => void, reject: (err?: any) => void, progress: (val?: P) => void): void;
}

export interface ProgressPromiseDeferred<T, P> {
    resolve(val?: T | PromiseLike<T>): void;
    reject(err?: any): void;
    progress(val: P): void;

    promise: ProgressPromise<T, P>;
}

export type ProgressPromiseable<T, P> = T | PromiseLike<T> | ProgressPromise<T, P>;

function isProgressPromise<T, P>(p: ProgressPromiseable<T, P>): p is ProgressPromise<T, P> {
    return "progress" in p;
}

function createProgressFunction<T, P>(p: ProgressPromise<T, P>): ProgressPromiseCallback<P> {
    return (val: P) => {
        const
            cbs = p._progressesCallbacks,
            len = cbs.length;

        for (let i = 0; i < len; i++) {
            cbs[i].call(undefined, val);
        }

        p._progress = val;
    };
}

function initAllProgresses<T, P>(promises: ProgressPromiseable<T, P>[], progress: ProgressPromiseCallback<P[]>): void {
    const
        len = promises.length,
        progresses: P[] = new Array(len);

    let i = 0,
        p: ProgressPromiseable<T, P>;

    for (; i < len; i++) {
        p = promises[i];
        progresses[i] = undefined;

        if (isProgressPromise(p)) {
            p.progress(initAllProgressFunction.bind(undefined, progress, progresses, i));
        }
    }
}

function initAllProgressFunction<T, P>(progress: ProgressPromiseCallback<P[]>, progresses: P[], index: number, val: P): void {
    progresses[index] = val;
    progress(progresses);
}

function cleaner() {
    this._progressesCallbacks = undefined;
}

export class ProgressPromise<T, P> implements PromiseLike<T> {
    public _innerPromise: Promise<T>;
    public _progress: P = undefined;
    public _progressesCallbacks: ProgressPromiseCallback<P>[] = [];

    constructor(executor: ProgressPromiseExecutor<T, P>) {
        if (!(this instanceof ProgressPromise)) {
            throw new TypeError("Failed to construct 'ProgressPromise': Please use the 'new' operator, this object constructor cannot be called as a function.");
        }

        this._innerPromise = new Promise((resolve, reject) => {
            executor(resolve, reject, createProgressFunction(this));
        });

        const clean = cleaner.bind(this);
        this._innerPromise.then(clean, clean);
    };

    public progress(onProgress: ProgressPromiseCallback<P>): ProgressPromise<T, P> {
        if (this._progressesCallbacks) {
            this._progressesCallbacks.push(onProgress);
        }

        if (typeof this._progress !== "undefined") {
            onProgress.call(undefined, this._progress);
        }

        return this;
    }

    /**
     * Create a new Promise by chaining given callback to current Promise
     * @param {PromiseCallback} onFulfilled Callback to be called when Promise fulfills
     * @param {PromiseCallback} [onRejected] Callback to be called when Promise fails
     * @returns {Promise} Chained Promise
     */
    public then<U>(onFulfilled: (value: T) => U | PromiseLike<U>): Promise<U>;
    public then<U>(onFulfilled: (value: T) => U | PromiseLike<U>, onRejected: (err?: any) => void | U): Promise<U>;
    public then<U>(onFulfilled: (value: T) => U | PromiseLike<U>, onRejected?: (err?: any) => void | U): Promise<U> {
        return this._innerPromise.then(onFulfilled, onRejected);
    }

    /**
     * The catch function allows to apply a callback on rejection handler.
     * It is equivalent to promise.then(undefined, onRejected)
     * @param {PromiseCallback} onRejected callback to be called whenever promise fail
     * @returns {Promise} A chained Promise which handle error and fullfil
     */
    public catch<U>(onRejected: (err?: any) => void | U): Promise<U> {
        return this._innerPromise.catch(onRejected);
    }

    public static defer<T, P>(): ProgressPromiseDeferred<T, P> {
        const def: any = {};
        def.promise = new ProgressPromise((res, rej, pro) => {
            def.resolve = res;
            def.reject = rej;
            def.progress = pro;
        });

        return def;
    }

    public static all<T, P>(promises: ProgressPromiseable<T, P>[]): ProgressPromise<T[], P[]> {
        return new ProgressPromise<T[], P[]>((resolve, reject, progress) => {
            initAllProgresses(promises, progress);
            Promise.all(promises).then(resolve, reject);
        });
    }
    public static race<T, P>(promises: ProgressPromiseable<T, P>[]): ProgressPromise<T, P[]> {
        return new ProgressPromise<T, P[]>((resolve, reject, progress) => {
            initAllProgresses(promises, progress);
            Promise.race(promises).then(resolve, reject);
        });
    }
}
