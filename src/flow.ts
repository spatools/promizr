/// <reference path="../_definitions.d.ts" />

const own = Object.prototype.hasOwnProperty;

export interface PromiseTaskExecutorObject<T> {
    [key: string]: () => Promise<T>;
}

export interface PromiseSeriesObjectResult<T> {
    [key: string]: T;
}

function listSeries<T>(array: PromiseTaskExecutor<T>[]): Promise<T[]> {
    var p = Promise.resolve(),
        i = 0, len = array.length,
        results = [];

    function capture(index: number): Promise<void> {
        return array[index]().then(result => {
            results.push(result);
        });
    }

    for (; i < len; i++) {
        p = p.then(capture.bind(null, i));
    }

    return p.then(() => results);
}
function objectSeries<T>(obj: PromiseTaskExecutorObject<T>): Promise<PromiseSeriesObjectResult<T>> {
    var p = Promise.resolve(),
        results = {},
        key: string;

    function capture(key: string): Promise<void> {
        return obj[key]().then(result => {
            results[key] = result;
        });
    }

    for (key in obj) {
        if (own.call(obj, key)) {
            p = p.then(capture.bind(null, key));
        }
    }

    return p.then(() => results);
}

export function series<T>(tasks: PromiseTaskExecutor<T>[]): Promise<T[]>;
export function series<T>(tasks: PromiseTaskExecutorObject<T>): Promise<PromiseSeriesObjectResult<T>>;
export function series<T>(tasks: PromiseTaskExecutor<T>[]|PromiseTaskExecutorObject<T>): Promise<T[]|PromiseSeriesObjectResult<T>> {
    return Array.isArray(tasks) ?
        listSeries(<PromiseTaskExecutor<T>[]>tasks) :
        objectSeries(<PromiseTaskExecutorObject<T>>tasks);
}


function listParallel<T>(array: PromiseTaskExecutor<T>[]): Promise<T[]> {
    var promises = array.map(exec => exec());
    return Promise.all(promises);
}
function objectParallel<T>(obj: PromiseTaskExecutorObject<T>): Promise<PromiseSeriesObjectResult<T>> {
    var promises = [],
        results = {},
        key: string;

    function capture(key: string): Promise<void> {
        return obj[key]().then(result => {
            results[key] = result;
        });
    }

    for (key in obj) {
        if (own.call(obj, key)) {
            promises.push(capture(key));
        }
    }

    return Promise.all(promises).then(() => results);
}

export function parallel<T>(tasks: PromiseTaskExecutor<T>[]): Promise<T[]>;
export function parallel<T>(tasks: PromiseTaskExecutorObject<T>): Promise<PromiseSeriesObjectResult<T>>;
export function parallel<T>(tasks: PromiseTaskExecutor<T>[]|PromiseTaskExecutorObject<T>): Promise<T[]|PromiseSeriesObjectResult<T>> {
    return Array.isArray(tasks) ?
        listParallel(<PromiseTaskExecutor<T>[]>tasks) :
        objectParallel(<PromiseTaskExecutorObject<T>>tasks);
}


export function whilst<T>(test: () => boolean, task: PromiseTaskExecutor<T>): Promise<void> {
    function next(): Promise<void> {
        if (test()) {
            return task().then(next);
        }
    }

    return Promise.resolve().then(next);
}

export function doWhilst<T>(executor: PromiseTaskExecutor<T>, test: (res?: T) => boolean): Promise<void> {
    function next(): Promise<void> {
        return executor().then(res => {
            if (test(res)) {
                return next();
            }
        });
    }

    return Promise.resolve().then(next);
}


export function until<T>(test: () => boolean, task: PromiseTaskExecutor<T>): Promise<void> {
    function next(): Promise<void> {
        if (!test()) {
            return task().then(next);
        }
    }

    return Promise.resolve().then(next);
}

export function doUntil<T>(task: PromiseTaskExecutor<T>, test: (res?: T) => boolean): Promise<void> {
    function next(): Promise<void> {
        return task().then(res => {
            if (!test(res)) {
                return next();
            }
        });
    }

    return Promise.resolve().then(next);
}


export function forever<T>(task: PromiseTaskExecutor<T>): Promise<void> {
    function next(): Promise<void> {
        return task().then(next);
    }

    return Promise.resolve().then(next);
}

export function waterfall<T>(tasks: PromiseTaskExecutor<any>[]): Promise<T> {
    var p = Promise.resolve(),
        i = 0, len = tasks.length;

    for (; i < len; i++) {
        p = p.then(tasks[i]);
    }

    return p;
}


export function compose<T>(...tasks: PromiseTaskExecutor<any>[]): PromiseTaskExecutor<T> {
    return function () {
        var p = Promise.resolve(),
            last = tasks.pop(),
            self = this, args = arguments,
            i = tasks.length - 1;

        p = p.then(() => last.apply(self, args));

        for (; i >= 0; i--) {
            p = p.then(tasks[i]);
        }

        return p;
    };
}

export function seq<T>(...tasks: PromiseTaskExecutor<any>[]): PromiseTaskExecutor<T> {
    return function () {
        var p = Promise.resolve(),
            first = tasks.shift(),
            self = this, args = arguments,
            i = 0, len = tasks.length;

        p = p.then(() => first.apply(self, args));

        for (; i < len; i++) {
            p = p.then(tasks[i]);
        }

        return p;
    };
}

export function applyEach<T>(tasks: PromiseTaskExecutor<T>[], ...args: any[]): PromiseTaskExecutor<T[]>|Promise<T[]> {
    if (args.length > 0) {
        tasks = tasks.map(e => () => e.apply(null, args));
        return parallel(tasks);
    }
    else {
        return function () {
            var args = arguments;
            tasks = tasks.map(e => () => e.apply(this, args));
            return parallel(tasks);
        };
    }
}

export function applyEachSeries<T>(tasks: PromiseTaskExecutor<T>[], ...args: any[]): PromiseTaskExecutor<T[]>|Promise<T[]> {
    if (args.length > 0) {
        tasks = tasks.map(e => () => e.apply(null, args));
        return series(tasks);
    }
    else {
        return function () {
            var args = arguments;
            tasks = tasks.map(e => () => e.apply(this, args));
            return series(tasks);
        };
    }
}


export function retry<T>(times: number, task: PromiseTaskExecutor<T>): Promise<T> {
    var promise;

    try {
        promise = Promise.resolve(task());
    }
    catch (e) {
        promise = Promise.reject(e);
    }

    return promise.catch(err => {
        if (times > 1) {
            return retry(times - 1, task);
        }

        throw err;
    });
}

export function times<T>(times: number, task: PromiseTaskExecutor<T>): Promise<T[]> {
    var results: Promise<T>[] = [],
        i = times;

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
export function timesSeries<T>(times: number, task: PromiseTaskExecutor<T>): Promise<T[]> {
    var p = Promise.resolve<void>(),
        results: T[] = [],
        i = times;

    function capture() {
        return Promise.resolve(task()).then(result => { results.push(result); });
    }

    for (; i > 0; i--) {
        p = p.then(capture);
    }

    return p.then(() => results);
}

