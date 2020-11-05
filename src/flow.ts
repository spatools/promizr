import type * as Tuples from "./tuples";

import { ensure, EnsurePromise, PromiseExecutor } from "./utils";

export type PromiseTaskExecutor<T = any> = () => T | Promise<T>;
export type PromiseTaskExecutorObject<T> = Record<string, () => Promise<T>>;
export type PromizrObjectResult<T> = { [K in keyof T]: T[K] extends () => Promise<infer R> ? R : T[K]; }

function listSeries<T>(array: Array<PromiseTaskExecutor<T>>): Promise<T[]> {
    const results: T[] = [];
    const len = array.length;
    let p = ensure();
    for (let i = 0; i < len; i++) {
        p = p.then(createIterator(array[i]));
    }

    return p.then(() => results);

    function createIterator(executor: PromiseTaskExecutor<T>): () => Promise<void> {
        return function iterator(): Promise<void> {
            return ensure(executor()).then(result => { results.push(result); });
        }
    }
}

function objectSeries<T extends Record<string, unknown>>(obj: T): Promise<PromizrObjectResult<T>> {
    const results: Record<string, unknown> = {};
    let p = ensure();

    for (const key in obj) {
        if (typeof obj[key] === "function") {
            p = p.then(createIterator(key, obj[key] as PromiseTaskExecutor<T>));
        }
    }

    return p.then(() => results as PromizrObjectResult<T>);

    function createIterator(key: string, executor: PromiseTaskExecutor<T>): () => Promise<void> {
        return function iterator(): Promise<void> {
            return ensure(executor()).then(result => { results[key] = result; });
        }
    }
}

export function series<T>(tasks: Array<PromiseTaskExecutor<T>>): Promise<T[]>;
export function series<T extends Record<string, unknown>>(tasks: T): Promise<PromizrObjectResult<T>>;
export function series(tasks: unknown): Promise<unknown> {
    return Array.isArray(tasks) ?
        listSeries(tasks) :
        objectSeries(tasks as Record<string, unknown>);
}


function listParallel<T>(array: Array<PromiseTaskExecutor<T>>): Promise<T[]> {
    const promises = array.map(exec => exec());
    return Promise.all(promises);
}
function objectParallel<T extends Record<string, unknown>>(obj: T): Promise<PromizrObjectResult<T>> {
    const results: Record<string, unknown> = {};
    const promises: Array<Promise<void>> = []

    for (const key in obj) {
        if (typeof obj[key] === "function") {
            promises.push(interator(key, obj[key] as PromiseTaskExecutor<T>));
        }
    }

    return Promise.all(promises).then(() => results as PromizrObjectResult<T>);

    function interator(key: string, executor: PromiseTaskExecutor<T>): Promise<void> {
        return ensure(executor()).then(result => { results[key] = result; });
    }
}

export function parallel<T>(tasks: Array<PromiseTaskExecutor<T>>): Promise<T[]>;
export function parallel<T extends Record<string, unknown>>(tasks: T): Promise<PromizrObjectResult<T>>;
export function parallel(tasks: unknown): Promise<unknown> {
    return Array.isArray(tasks) ?
        listParallel(tasks) :
        objectParallel(tasks as Record<string, unknown>);
}


export function whilst<T>(test: () => boolean, task: PromiseTaskExecutor<T>): Promise<void> {
    return Promise.resolve().then(next);

    function next(): void | Promise<void> {
        if (test()) {
            return ensure(task()).then(next);
        }
    }
}

export function doWhilst<T>(executor: PromiseTaskExecutor<T>, test: (res?: T) => boolean): Promise<void> {
    return Promise.resolve().then(next);

    function next(): Promise<void> {
        return ensure(executor()).then(res => {
            if (test(res)) {
                return next();
            }
        });
    }
}

export function until<T>(test: () => boolean, task: PromiseTaskExecutor<T>): Promise<void> {
    return Promise.resolve().then(next);

    function next(): void | Promise<void> {
        if (!test()) {
            return ensure(task()).then(next);
        }
    }
}

export function doUntil<T>(task: PromiseTaskExecutor<T>, test: (res?: T) => boolean): Promise<void> {
    return Promise.resolve().then(next);

    function next(): Promise<void> {
        return ensure(task()).then(res => {
            if (!test(res)) {
                return next();
            }
        });
    }
}

export function forever<T>(task: PromiseTaskExecutor<T>): Promise<void> {
    return Promise.resolve().then(next);

    function next(): Promise<void> {
        return ensure(task()).then(next);
    }
}

export function waterfall<T>(tasks: PromiseTaskExecutor[]): Promise<T> {
    let p = ensure();

    for (const task of tasks) {
        p = p.then(task);
    }

    return p as Promise<T>;
}

type GetFirstReturnType<T extends PromiseExecutor[]> = T extends [] ? void : ReturnType<Tuples.GetFirst<T>>;
type GetLastReturnType<T extends PromiseExecutor[]> = T extends [] ? void : ReturnType<Tuples.GetLast<T>>;

export function compose<T extends PromiseExecutor[]>(...tasks: T): (...args: Parameters<Tuples.GetLast<T>>) => EnsurePromise<GetFirstReturnType<T>> {
    return function (this: unknown, ...args: unknown[]): EnsurePromise<GetFirstReturnType<T>> {
        const last = tasks.pop();
        if (!last) return ensure() as Promise<any>;

        let p = ensure();
        p = p.then(() => last.apply(this, args));

        for (let i = tasks.length - 1; i >= 0; i--) {
            p = p.then(tasks[i]);
        }

        return p as EnsurePromise<GetFirstReturnType<T>>;
    };
}

export function seq<T extends PromiseExecutor[]>(...tasks: T): (...args: Parameters<Tuples.GetFirst<T>>) => EnsurePromise<GetLastReturnType<T>> {
    return function (this: unknown, ...args: unknown[]): EnsurePromise<GetLastReturnType<T>> {
        const first = tasks.shift();
        if (!first) return ensure() as Promise<any>;

        let p = ensure();
        p = p.then(() => first.apply(this, args));

        const len = tasks.length;
        for (let i = 0; i < len; i++) {
            p = p.then(tasks[i]);
        }

        return p as EnsurePromise<GetLastReturnType<T>>;
    };
}

export function applyEach<T extends PromiseExecutor[]>(tasks: T): (...args: Parameters<T[number]>) => EnsurePromise<ReturnType<T[number]>> {
    return function (this: unknown, ...args: unknown[]): EnsurePromise<ReturnType<T[number]>> {
        const iterators = tasks.map(e => () => e.apply(this, args));
        return parallel(iterators) as EnsurePromise<ReturnType<T[number]>>;
    };
}

export function applyEachSeries<T extends PromiseExecutor[]>(tasks: T): (...args: Parameters<T[number]>) => EnsurePromise<ReturnType<T[number]>> {
    return function (this: unknown, ...args: unknown[]): EnsurePromise<ReturnType<T[number]>> {
        const iterators = tasks.map(e => () => e.apply(this, args));
        return series(iterators) as EnsurePromise<ReturnType<T[number]>>;
    };
}


export function retry<T>(times: number, task: PromiseTaskExecutor<T>): Promise<T> {
    let promise: Promise<T>;

    try {
        promise = ensure(task());
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
    const results: Array<T | Promise<T>> = [];

    for (let i = times; i > 0; i--) {
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
    const results: T[] = [];

    let p = ensure();
    for (let i = times; i > 0; i--) {
        p = p.then(capture);
    }

    return p.then(() => results);

    function capture(): Promise<void> {
        return ensure(task()).then(result => { results.push(result); });
    }
}

