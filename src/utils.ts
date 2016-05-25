/// <reference path="../_definitions.d.ts" />

export interface TypedFunction<T> {
    (...args: any[]): T;
}

export interface HashFunction {
    (args: any[]): string;
}

export interface Deferred<T> {
    resolve(val?: T | PromiseLike<T>): void;
    reject(err?: any): void;

    promise: Promise<T>;
}

const slice = Array.prototype.slice;

export function apply<T>(task: TypedFunction<T>, ...args: any[]): TypedFunction<T> {
    return function () {
        return task.apply(null, args);
    };
}
export function applyOn<T>(owner: any, task: string | TypedFunction<T>, ...args: any[]): TypedFunction<T> {
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
export function partialOn<T>(owner: any, task: string | TypedFunction<T>, ...args: any[]): TypedFunction<T> {
    return function () {
        if (typeof task === "string") {
            return owner[task].apply(owner, args.concat(arguments));
        }
        else {
            return task.apply(owner, args.concat(arguments));
        }
    };
}

export function tap<T, U>(task: TypedFunction<T>, ...args: any[]): (arg: U) => Promise<U> {
    return function (result) {
        return Promise.resolve(task.apply(null, args))
            .then(() => result);
    };
}
export function tapOn<T, U>(owner: any, task: string | TypedFunction<T>, ...args: any[]): (arg: U) => U {
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

export function memoize<T>(task: PromiseTaskExecutor<T>, hash?: boolean | HashFunction): PromiseTaskExecutor<T> {
    let cache,
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
        const args = slice.apply(arguments);
        let hashed, cached;

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
export function module<T>(): Promise<T | T[]> {
    let args = slice.call(arguments);
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

export function denodify<T>(owner: any, fn: Function, ...args: any[]): Promise<T>;
export function denodify<T>(fn: Function, ...args: any[]): Promise<T>;
export function denodify<T>(ownerOrFn: Function | any): Promise<T> {
    const args = arguments;
    let owner = args[0],
        fn = args[1], 
        num = 2;
        
    if (typeof owner === "function" && typeof fn !== "function") {
        fn = owner;
        owner = undefined;
        num = 1;
    }
    
    return promisify(owner, fn).apply(null, slice.call(args, num));
}

export function promisify<T>(fn: Function): (...args: any[]) => Promise<T>;
export function promisify<T>(owner: any, fn: Function): (...args: any[]) => Promise<T>;
export function promisify<T>(owner: any, fn?: Function): (...args: any[]) => Promise<T> {
    if (typeof owner === "function" && typeof fn !== "function") {
        fn = owner;
        owner = undefined;
    }
    
    return function () {
        const args = slice.call(arguments);
        
        return new Promise((resolve, reject) => {
            args.push(callback);
            fn.apply(owner, args);
            
            function callback(err) {
                if (err) {
                    return reject(err);
                }
                
                let result = slice.call(arguments, 1);
                if (result.length === 0) {
                    return resolve();
                }
                
                if (result.length === 1) {
                    result = result[0];
                }
                
                resolve(result);
            }
        });
    };
}

export function uncallbackify<T>(owner: any, fn: Function, ...args: any[]): Promise<T>;
export function uncallbackify<T>(fn: Function, ...args: any[]): Promise<T>;
export function uncallbackify<T>(ownerOrFn: Function | any): Promise<T> {
    const args = arguments;
    let owner = args[0],
        fn = args[1],
        num = 2;
        
    if (typeof owner === "function" && typeof fn !== "function") {
        fn = owner;
        owner = undefined;
        num = 1;
    }
    
    return cbpromisify(owner, fn).apply(null, slice.call(args, num));
}

export function cbpromisify<T>(fn: Function): (...args: any[]) => Promise<T>;
export function cbpromisify<T>(owner: any, fn: Function): (...args: any[]) => Promise<T>;
export function cbpromisify<T>(owner: any, fn?: Function): (...args: any[]) => Promise<T> {
    if (typeof owner === "function" && typeof fn !== "function") {
        fn = owner;
        owner = undefined;
    }
    
    return function () {
        const args = slice.call(arguments);
        return new Promise((resolve, reject) => {
            args.push(success, error);
            fn.apply(owner, args);
            
            function success() {
                let result = slice.call(arguments);
                if (result.length === 0) {
                    return resolve();
                }
                
                if (result.length === 1) {
                    result = result[0];
                }
                
                resolve(result);
            }
            
            function error() {
                let err = slice.call(arguments);
                if (err.length === 1) {
                    err = err[0];
                }
                
                if (!(err instanceof Error)) {
                    err = new Error(err.toString());
                    err.innerError = err;
                }
                reject(err);
            }
        });
    };
}

export function defer<T>(): Deferred<T> {
    const dfd = { resolve: null, reject: null, promise: null } as Deferred<any>;

    dfd.promise = new Promise((resolve, reject) => {
        dfd.resolve = resolve;
        dfd.reject = reject;
    });

    return dfd;
};

export function polyfill(): PromiseConstructorLike {
    if (typeof process === "undefined" || {}.toString.call(process) !== "[object process]") {
        throw new Error("This method is only available in Node.JS environment");
    }

    return require("./polyfill");
}
