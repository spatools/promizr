/// <reference path="base.d.ts" />

export function apply<T>(task: TypedFunction<T>, ...args: any[]): TypedFunction<T> {
    return function () {
        return task.apply(null, args);
    };
}
export function applyOn<T>(owner: any, task: string|TypedFunction<T>, ...args: any[]): TypedFunction<T> {
    return function () {
        if (typeof task === "string") {
            return owner[task].apply(owner, args);
        }
        else {
            return task.apply(owner, args);
        }
    };
}

export function partial<T>(task: TypedFunction<T>, ...args: any[]): TypedFunction<T> {
    return function () {
        return task.apply(null, args.concat(arguments));
    };
}
export function partialOn<T>(owner: any, task: string|TypedFunction<T>, ...args: any[]): TypedFunction<T> {
    return function () {
        if (typeof task === "string") {
            return owner[task].apply(owner, args.concat(arguments));
        }
        else {
            return task.apply(owner, args.concat(arguments));
        }
    };
}

export function tap<T, U>(task: TypedFunction<T>, ...args: any[]): (arg: U) => U {
    return function (result) {
        task.apply(null, args);
        return result;
    };
}
export function tapOn<T, U>(owner: any, task: string|TypedFunction<T>, ...args: any[]): (arg: U) => U {
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

type HashFunction = (args: any[]) => string;
export function memoize<T>(task: PromiseTaskExecutor<T>, hash?: boolean|HashFunction): PromiseTaskExecutor<T> {
    var cache,
        haveToHash = typeof hash !== "undefined",
        hasher: HashFunction;

    if (haveToHash) {
        cache = {};

        if (typeof hash === "function") {
            hasher = hash;
        }
        else {
            hasher = JSON.stringify;
        }
    }

    function save(hashed: string, value: any) {
        if (haveToHash) {
            cache[hashed] = value;
        }
        else {
            cache = value;
        }
    }

    function result(): Promise<T> {
        var args = Array.prototype.slice.apply(arguments),
            hashed, cached;

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

        cached = task.apply(null, arguments).then(res => {
            save(hashed, res);

            return res;
        });

        save(hashed, cached);

        return cached;
    }

    return result;
}

export function log<T>(task: PromiseTaskExecutor<T>, ...args: any[]): Promise<T> {
    return task.apply(null, args).then(
        result => { console.log(result); return result; },
        err => { console.error(err); throw err; });
}

export function dir<T>(task: PromiseTaskExecutor<T>, ...args: any[]): Promise<T> {
    return task.apply(null, args).then(
        result => { console.dir(result); return result; },
        err => { console.error(err); throw err; });
}

export function timeout(ms?: number): Promise<void> {
    return new Promise<void>(resolve => {
        setTimeout(() => { resolve.call(null); }, ms || 1);
    });
}

export function immediate(): Promise<void> {
    return new Promise<void>(resolve => { nextTick(resolve); });
}

export function module<T>(name: string): Promise<T>;
export function module<T>(names: string[]): Promise<T[]>;
export function module<T>(...names: string[]): Promise<T[]>;
export function module<T>(): Promise<T|T[]> {
    var args = Array.prototype.slice.call(arguments);
    if (args.length === 0) {
        return Promise.resolve();
    }

    return new Promise<any>((resolve, reject) => {
        if (args.length === 1 && Array.isArray(args[0])) {
            args = args[0];
        }

        try {
            require(
                args,
                (...mods: any[]) => { resolve(mods.length === 1 ? mods[0] : mods); },
                (err) => { reject(err); }
                );
        }
        catch (e) {
            reject(e);
        }
    });
}
