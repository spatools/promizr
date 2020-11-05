import type * as Tuples from "./tuples";
import { nextTick } from "./nextTick";

export type PromiseExecutor<T = any> = (...args: any[]) => T | Promise<T>;

export type UnPromise<T> = T extends Promise<infer R> ? R : T;
export type EnsurePromise<T> = Promise<UnPromise<T>>;

type TypedFunction<T = any> = (...args: any[]) => T;
type HashFunction = (args: any[]) => string;

export type MethodNames<T> = {
    [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? K : never;
}[keyof T];

type PartialParameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? Partial<P> : never;
type RestOfParameters<Method extends (...args: any[]) => any, UsedParameters extends any[]> = Tuples.RemoveFromStart<Parameters<Method>, UsedParameters>;
type ParametersWithoutLast<Method extends (...args: any[]) => any> = Tuples.RemoveFromEnd<Parameters<Method>, [Tuples.GetLast<Parameters<Method>>]>;
type ParametersWithoutLast2<Method extends (...args: any[]) => any> = Tuples.RemoveFromEnd<Parameters<Method>, [Tuples.GetLast2<Parameters<Method>>, Tuples.GetLast<Parameters<Method>>]>;

type NodeStyleCallback<T = any> = (err: any, ...rest: T[]) => any;
type NodeStyleCallbackResultType<T extends NodeStyleCallback> =
    T extends (err: any) => any ? void :
    T extends (err: any, rest: infer Result) => any ? Result :
    T extends (err: any, ...rest: infer Results) => any ? Results :
    void;

type FunctionWithNodeStyleCallback = (...args: [...any, NodeStyleCallback]) => any;
type FunctionWithNodeStyleCallbackReturnType<T extends FunctionWithNodeStyleCallback> = NodeStyleCallbackResultType<Tuples.GetLast<Parameters<T>>>;

type ErrorCalback = (err: Error) => any;
type SimpleCallback<T = any> = (...args: T[]) => any;
type SimpleCallbackResultType<T extends SimpleCallback> =
    T extends () => any ? void :
    T extends (arg: infer Result) => any ? Result :
    T extends (...args: infer Results) => any ? Results :
    void;

type FunctionWithMultiCallbacks = (...args: [...any, SimpleCallback, ErrorCalback]) => any;
type FunctionWithMultiCallbacksReturnType<T extends FunctionWithMultiCallbacks> = SimpleCallbackResultType<Tuples.GetLast2<Parameters<T>>>;

export interface Deferred<T> {
    resolve(val?: T | PromiseLike<T>): void;
    reject(err?: any): void;

    promise: Promise<T>;
}

export function apply<T extends TypedFunction>(task: T, ...args: Parameters<T>): () => ReturnType<T> {
    return () => {
        return task(...args);
    };
}
export function applyOn<O, K extends MethodNames<O>>(owner: O, task: K, ...args: Parameters<O[K]>): () => ReturnType<O[K]>;
export function applyOn<O, T extends TypedFunction>(owner: O, task: T, ...args: Parameters<T>): () => ReturnType<T>;
export function applyOn(owner: Record<string, TypedFunction>, task: string | TypedFunction, ...args: any[]): TypedFunction {
    if (typeof task === "string") {
        return () => owner[task](...args);
    }

    return () => task.apply(owner, args);
}

export function partial<Method extends TypedFunction, Arguments extends PartialParameters<Method>>(task: Method, ...topArgs: Arguments): (...args: RestOfParameters<Method, Arguments>) => ReturnType<Method> {
    return (...args) => {
        return task(...topArgs.concat(args));
    };
}
export function partialOn<O, Key extends MethodNames<O>, Arguments extends PartialParameters<O[Key]>>(owner: O, task: Key, ...args: Arguments): (...args: RestOfParameters<O[Key], Arguments>) => ReturnType<O[Key]>;
export function partialOn<O, Method extends TypedFunction, Arguments extends PartialParameters<Method>>(owner: O, task: Method, ...args: Arguments): (...args: RestOfParameters<Method, Arguments>) => ReturnType<Method>;
export function partialOn(owner: Record<string, TypedFunction>, task: string | TypedFunction, ...topArgs: any[]): TypedFunction {
    if (typeof task === "string") {
        return (...args) => owner[task](...topArgs.concat(args));
    }

    return (...args) => task.apply(owner, topArgs.concat(args));
}

export function tap<Task extends TypedFunction>(task: Task, ...args: Parameters<Task>): <U>(arg: U) => Promise<U> {
    return (result) => ensure(task(...args)).then(() => result);
}
export function tapOn<O, K extends MethodNames<O>>(owner: O, task: K, ...args: Parameters<O[K]>): <U>(arg: U) => Promise<U>;
export function tapOn<O, T extends TypedFunction>(owner: O, task: T, ...args: Parameters<T>): <U>(arg: U) => Promise<U>;
export function tapOn<U>(owner: Record<string, TypedFunction>, task: string | TypedFunction, ...args: any[]): (arg: U) => Promise<U> {
    if (typeof task === "string") {
        return (res) => ensure(owner[task](...args)).then(() => res);
    }

    return (res) => task.apply(owner, args).then(() => res);
}

export function memoize<T extends PromiseExecutor<any>>(task: T, hash?: boolean | HashFunction): (...args: Parameters<T>) => EnsurePromise<ReturnType<T>> {
    const cache: Record<string, UnPromise<ReturnType<T>> | EnsurePromise<ReturnType<T>>> = {};
    const hasher: HashFunction | undefined = typeof hash === "function" ? hash : hash === true ? JSON.stringify : undefined;

    function save(hashed: string | undefined, value: UnPromise<ReturnType<T>> | EnsurePromise<ReturnType<T>>): typeof value {
        cache[hashed || "default"] = value;
        return value;
    }

    return (...args: Parameters<T>) => {
        const hashed = hasher?.(args);
        const cached = cache[hashed || "default"];

        if (cached) {
            return ensure(cached);
        }

        const promise = ensure(task(...args))
            .then(res => save(hashed, res));

        return save(hashed, promise);
    }
}

export function log<T extends PromiseExecutor>(task: T, ...args: Parameters<T>): EnsurePromise<T> {
    return ensure(task(...args)).then(
        result => { console.log(result); return result; },
        err => { console.error(err); throw err; }
    );
}

export function dir<T extends PromiseExecutor>(task: T, ...args: Parameters<T>): EnsurePromise<T> {
    return ensure(task(...args)).then(
        result => { console.dir(result); return result; },
        err => { console.error(err); throw err; }
    );
}

export function timeout(ms?: number): Promise<void> {
    return new Promise<void>(resolve => {
        setTimeout(() => { resolve(); }, ms || 1);
    });
}

export function immediate(): Promise<void> {
    return new Promise<void>(resolve => { nextTick(resolve); });
}

export function denodify<T extends FunctionWithNodeStyleCallback>(fn: T, ...args: ParametersWithoutLast<T>): EnsurePromise<FunctionWithNodeStyleCallbackReturnType<T>>;
export function denodify<O extends Record<string, unknown>, T extends FunctionWithNodeStyleCallback>(owner: O, fn: T, ...args: ParametersWithoutLast<T>): EnsurePromise<FunctionWithNodeStyleCallbackReturnType<T>>;
export function denodify(ownerOrFn: Record<string, unknown> | undefined, ...args: unknown[]): Promise<any> {
    let owner = ownerOrFn,
        fn = args[0] as FunctionWithNodeStyleCallback,
        num = 1;

    if (typeof owner === "function" && typeof fn !== "function") {
        fn = owner;
        owner = undefined;
        num = 0;
    }

    return promisify(owner, fn)(...args.slice(num));
}

export function promisify<T extends FunctionWithNodeStyleCallback>(fn: T): (...args: ParametersWithoutLast<T>) => EnsurePromise<FunctionWithNodeStyleCallbackReturnType<T>>;
export function promisify<O, T extends FunctionWithNodeStyleCallback>(owner: O, fn: T): (...args: ParametersWithoutLast<T>) => EnsurePromise<FunctionWithNodeStyleCallbackReturnType<T>>;
export function promisify<T extends FunctionWithNodeStyleCallback>(owner: Record<string, unknown> | undefined, fn?: T): (...args: ParametersWithoutLast<T>) => EnsurePromise<FunctionWithNodeStyleCallbackReturnType<T>> {
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

            function callback(err: Error, ...results: any[]): void {
                if (err) return reject(err);
                if (results.length === 0) return resolve();
                if (results.length === 1) return resolve(results[0]);

                resolve(results as any);
            }
        });
    };
}

export function uncallbackify<T extends FunctionWithMultiCallbacks>(fn: T, ...args: ParametersWithoutLast2<T>): EnsurePromise<FunctionWithMultiCallbacksReturnType<T>>;
export function uncallbackify<O extends Record<string, unknown>, T extends FunctionWithMultiCallbacks>(owner: O, fn: T, ...args: ParametersWithoutLast2<T>): EnsurePromise<FunctionWithMultiCallbacksReturnType<T>>;
export function uncallbackify(ownerOrFn: Record<string, unknown> | undefined, ...args: unknown[]): Promise<any> {
    let owner = ownerOrFn,
        fn = args[0] as FunctionWithMultiCallbacks,
        num = 1;

    if (typeof owner === "function" && typeof fn !== "function") {
        fn = owner;
        owner = undefined;
        num = 0;
    }

    return cbpromisify(owner, fn)(...args.slice(num));
}

export function cbpromisify<T extends FunctionWithMultiCallbacks>(fn: T): (...args: ParametersWithoutLast2<T>) => EnsurePromise<FunctionWithMultiCallbacksReturnType<T>>;
export function cbpromisify<O, T extends FunctionWithMultiCallbacks>(owner: O, fn: T): (...args: ParametersWithoutLast2<T>) => EnsurePromise<FunctionWithMultiCallbacksReturnType<T>>;
export function cbpromisify<T extends FunctionWithNodeStyleCallback>(owner: Record<string, unknown> | undefined, fn?: T): (...args: ParametersWithoutLast2<T>) => EnsurePromise<FunctionWithMultiCallbacksReturnType<T>> {
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

            function success(...results: any[]): void {
                if (results.length === 0) return resolve();
                if (results.length === 1) return resolve(results[0]);
                resolve(results as any);
            }

            function error(...errors: any[]): void {
                if (errors.length === 1) {
                    errors = errors[0];
                }

                if (!(errors instanceof Error)) {
                    const err: any = new Error(errors.toString());
                    err.innerError = errors;
                    return reject(errors);
                }

                reject(errors);
            }
        });
    };
}

export function defer<T>(): Deferred<T> {
    const dfd: any = {};

    dfd.promise = new Promise((resolve, reject) => {
        dfd.resolve = resolve;
        dfd.reject = reject;
    });

    return dfd;
}

export function ensure(): Promise<unknown>;
export function ensure(value: null | undefined): Promise<void>;
export function ensure<T>(value: T | Promise<T>): Promise<T>;
export function ensure(value?: unknown): Promise<unknown> {
    if (typeof value === "undefined") {
        return Promise.resolve();
    }

    return Promise.resolve(value);
}
