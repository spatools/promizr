/**
 * @packageDocumentation
 *
 * Promise extensions and utility methods.
 */


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
export declare function apply<T extends Func>(action: T, ...args: Parameters<T>): () => Async<ReturnType<T>>;

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
export declare function applyEach<T extends AsyncFunction[]>(tasks: T): (...args: Parameters<T[number]>) => Async<Array<ReturnType<T[number]>>>;

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
export declare function applyEachSeries<T extends AsyncFunction[]>(tasks: T): (...args: Parameters<T[number]>) => Async<Array<ReturnType<T[number]>>>;

/**
 * @public
 *
 * Same as {@link apply} but call the `task` with `owner` `this` context.
 * If task is a string, it calls `owner[task]` function.
 *
 * @param owner - `this` context to use when calling `task`
 * @param task - The property name of function in `owner`
 * @param args - The `task` argument
 *
 * @example
 * ```typescript
 * const lib = {
 *     upper(value: string): string { return value.toUpperCase() }
 * }
 *
 * const task = promizr.applyOn(lib, "upper", "Value");
 *
 * const res = await task();
 * // res === "VALUE"
 * ```
 */
export declare function applyOn<O, K extends MethodNames<O>>(owner: O, task: K, ...args: Parameters<O[K]>): () => Async<ReturnType<O[K]>>;

/**
 * @public
 *
 * Same as {@link apply} but call the `task` with `owner` `this` context
 *
 * @param owner - `this` context to use when calling `task`
 * @param task - The function to apply
 * @param args - The `task` argument
 *
 * @example
 * ```typescript
 * const lib = {
 *     upper(value: string): string { return value.toUpperCase() }
 * }
 *
 * const task = promizr.applyOn(lib, lib.upper, "Value");
 *
 * const res = await task();
 * // res === "VALUE"
 * ```
 */
export declare function applyOn<O, T extends Func>(owner: O, task: T, ...args: Parameters<T>): () => Async<ReturnType<T>>;

/**
 * @public
 * Utility type to wrap value in a Promise.
 */
export declare type Async<T> = Promise<Awaited<T>>;

/**
 * @public
 * A function that may return a Promise.
 */
export declare type AsyncFunction<T = any> = (...args: any[]) => T | Promise<T>;

/**
 * @public
 * Asynchronous list iterator function.
 */
export declare type AsyncListIterator<T, U> = (item: T, index: number, list: T[]) => U | Promise<U>;

/**
 * @public
 * Asynchronous reduce iterator function.
 */
export declare type AsyncReduceIterator<T, U> = (memo: U, item: T, index: number, list: T[]) => U | Promise<U>;

/**
 * @public
 * A function that take no arguments and may return a Promise.
 */
export declare type AsyncTask<T = unknown> = () => T | Promise<T>;

/**
 * @public
 * Utility type to extract Promise resolution Type.
 */
export declare type Awaited<T> = T extends PromiseLike<infer R> ? R : T;

/**
 * @public
 * Transform a source object in an object where every AsyncTask is awaited.
 */
export declare type AwaitedObject<T> = {
    [K in keyof T]: T[K] extends () => infer R ? Awaited<R> : T[K];
};

declare type AwaitedTuple<T extends readonly unknown[]> = {
    [K in keyof T]: Awaited<T[K]>;
};

/**
 * @public
 *
 * Build a function that transform a multi-callback style function to a Promise version.
 *
 * @param fn - The function to promisify
 */
export declare function cbpromisify<T extends FunctionWithMultiCallbacks>(fn: T): (...args: ParametersWithoutLast2<T>) => Async<FunctionWithMultiCallbacksReturnType<T>>;

/**
 * @public
 *
 * Build a function that transform a multi-callback style function to a Promise version.
 *
 * @param owner - The `this` context to use when calling `fn`
 * @param fn - The function to promisify
 */
export declare function cbpromisify<O, T extends FunctionWithMultiCallbacks>(owner: O, fn: T): (...args: ParametersWithoutLast2<T>) => Async<FunctionWithMultiCallbacksReturnType<T>>;

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
export declare function compose<T extends AsyncFunction[]>(...tasks: T): (...args: Parameters<GetLast<T>>) => Async<GetFirstReturnType<T>>;

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
export declare function concat<T, U>(array: T[], iterator: AsyncListIterator<T, U[]>): Promise<U[]>;

/**
 * @public
 *
 * Same as {@link concat}, but executes in series instead of parallel.
 *
 * @param array - The array to iterate on
 * @param iterator - An iterator which returns arrays
 */
export declare function concatSeries<T, U>(array: T[], iterator: AsyncListIterator<T, U[]>): Promise<U[]>;

/**
 * @public
 *
 * Returns a new Deferred object.
 *
 * A Deferred object is an object containing 3 properties: `resolve`, `reject` and `promise`.
 * The `resolve` function resolves the `promise`.
 * The `reject` function rejects the `promise`.
 */
export declare function defer<T>(): Deferred<T>;

/**
 * @public
 * A Deferred is an object to control a Promise outside of executor.
 */
export declare type Deferred<T> = {
    resolve(val?: T | PromiseLike<T>): void;
    reject(err?: any): void;
    promise: Promise<T>;
};

/**
 * @public
 *
 * Same as {@link promisify} but call the function immediately.
 *
 * @param fn - The function to promisify
 * @param args - The arguments to pass to fn
 */
export declare function denodify<T extends FunctionWithNodeStyleCallback>(fn: T, ...args: ParametersWithoutLast<T>): Async<FunctionWithNodeStyleCallbackReturnType<T>>;

/**
 * @public
 *
 * Same as {@link promisify} but call the function immediately.
 *
 * @param owner - The `this` context to use when calling fn
 * @param fn - The function to promisify
 * @param args - The arguments to pass to fn
 */
export declare function denodify<O extends Record<string, unknown>, T extends FunctionWithNodeStyleCallback>(owner: O, fn: T, ...args: ParametersWithoutLast<T>): Async<FunctionWithNodeStyleCallbackReturnType<T>>;

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
export declare function dir<T extends AsyncFunction>(task: T, ...args: Parameters<T>): Async<T>;

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
export declare function doUntil<T>(task: AsyncTask<T>, test: (res: T) => boolean | Promise<boolean>): Promise<void>;

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
export declare function doWhilst<T>(task: AsyncTask<T>, test: (res: T) => boolean | Promise<boolean>): Promise<void>;

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
declare function each<T>(array: T[], iterator: AsyncListIterator<T, unknown>): Promise<void>;
export { each }
export { each as forEach }

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
declare function eachLimit<T>(array: T[], limit: number, iterator: AsyncListIterator<T, unknown>, options?: QueueOptions): Promise<void>;
export { eachLimit }
export { eachLimit as forEachLimit }

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
declare function eachSeries<T>(array: T[], iterator: AsyncListIterator<T, unknown>): Promise<void>;
export { eachSeries }
export { eachSeries as forEachSeries }

declare type ErrorCalback = (err: Error) => any;

/**
 * @public
 *
 * Returns `true` if every element in `array` satisfies an async test.
 *
 * @param array - The array to iterate on
 * @param iterator - The iterator which test each item
 */
export declare function every<T>(array: T[], iterator: AsyncListIterator<T, boolean>): Promise<boolean>;

/**
 * @public
 *
 * Execute `task` with given arguments by ensuring that the result is a Promise.
 * If task throws synchronously, it's wrapped as a Promise.
 *
 * @param task - The function to call
 * @param args - The arguments to pass to task
 */
export declare function exec<T extends Func>(task: T, ...args: Parameters<T>): Async<ReturnType<T>>;

/**
 * @public
 *
 * Sames as {@link exec} but use `owner` as `this` context when calling `task`.
 *
 * @param owner - The this context
 * @param task - The function to call
 * @param args - The arguments to pass to task
 */
export declare function execOn<T extends AsyncFunction>(owner: unknown, task: T, ...args: Parameters<T>): Async<ReturnType<T>>;

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
export declare function filter<T>(array: T[], iterator: AsyncListIterator<T, boolean>): Promise<T[]>;

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
export declare function filterSeries<T>(array: T[], iterator: AsyncListIterator<T, boolean>): Promise<T[]>;

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
export declare function find<T>(array: T[], iterator: AsyncListIterator<T, boolean>): Promise<T | undefined>;

/**
 * @public
 *
 * The same as {@link find}, only the `iterator` is applied to each item in `array` in series.
 * This means the result is always the first in the original `array` (in terms of array order) that passes the truth test.
 *
 * @param array - The array to iterate on
 * @param iterator - The iterator which test each item
 */
export declare function findSeries<T>(array: T[], iterator: AsyncListIterator<T, boolean>): Promise<T | undefined>;

/**
 * @public
 *
 * Calls the `task` indefinitely.
 * Note: if `task` throws, the process stops.
 *
 * @param task - The task to execute until it fails
 */
export declare function forever<T>(task: AsyncTask<T>): Promise<never>;

declare type Func = (...args: any[]) => any;

declare type FunctionWithMultiCallbacks = (...args: [...any, SimpleCallback, ErrorCalback]) => any;

declare type FunctionWithMultiCallbacksReturnType<T extends FunctionWithMultiCallbacks> = SimpleCallbackResultType<GetLast2<Parameters<T>>>;

declare type FunctionWithNodeStyleCallback = (...args: [...any, NodeStyleCallback]) => any;

declare type FunctionWithNodeStyleCallbackReturnType<T extends FunctionWithNodeStyleCallback> = NodeStyleCallbackResultType<GetLast<Parameters<T>>>;

declare type GetFirst<Tuple extends readonly any[]> = Tuple[0];

declare type GetFirstReturnType<T extends Func[]> = T extends [] ? void : ReturnType<GetFirst<T>>;

declare type GetLast<Tuple extends readonly any[]> = Tuple[PreviousIndex<GetLength<Tuple>>];

declare type GetLast2<Tuple extends readonly any[]> = Tuple[PreviousIndex<PreviousIndex<GetLength<Tuple>>>];

declare type GetLastReturnType<T extends Func[]> = T extends [] ? void : ReturnType<GetLast<T>>;

declare type GetLength<Tuple extends readonly any[]> = Tuple extends {
    length: infer L;
} ? L : -1;

declare type HashFunction = (args: any[]) => string;

/**
 * @public
 *
 * Returns a Promise that resolves on next tick.
 */
export declare function immediate(): Promise<void>;

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
export declare function log<T extends AsyncFunction>(task: T, ...args: Parameters<T>): Async<T>;

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
export declare function map<T, U>(array: T[], iterator: AsyncListIterator<T, U>): Promise<U[]>;

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
export declare function mapLimit<T, U>(array: T[], limit: number, iterator: AsyncListIterator<T, U>, options?: QueueOptions): Promise<U[]>;

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
export declare function mapSeries<T, U>(array: T[], iterator: AsyncListIterator<T, U>): Promise<U[]>;

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
export declare function memoize<T extends AsyncFunction>(task: T, hash?: boolean | HashFunction): (...args: Parameters<T>) => Async<ReturnType<T>>;

/** Utility type to extract keys from object where value is a function. */
declare type MethodNames<T> = {
    [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? K : never;
}[keyof T];

/**
 * @public
 *
 * Use the best next tick function depending on platform.
 *
 * @param cb - The callback to call on next tick
 */
export declare const nextTick: (cb: NextTickCallback) => void;

declare type NextTickCallback = () => void;

declare type NodeStyleCallback<T = any> = (err: any, ...rest: T[]) => any;

declare type NodeStyleCallbackResultType<T extends NodeStyleCallback> = T extends (err: any) => any ? void : T extends (err: any, rest: infer Result) => any ? Result : T extends (err: any, ...rest: infer Results) => any ? Results : void;

/**
 * @public
 *
 * Run given tasks in parallel and resolves with an array of the results of each task.
 *
 * @param tasks - The array of functions to execute in parallel
 */
export declare function parallel<T>(tasks: Array<AsyncTask<T>>): Promise<T[]>;

/**
 * @public
 *
 * Run found tasks in given object in parallel and resolves with an object where all tasks are resolved to their values.
 *
 * @param obj - The object which contains tasks to execute in parallel
 */
export declare function parallel<T extends Record<string, unknown>>(obj: T): Promise<AwaitedObject<T>>;

/**
 * @public
 *
 * Sames as {@link parallel} but limit the number of tasks that run concurrently.
 *
 * Note: The resulting array may not be in the same order as the source array.
 *
 * @param tasks - The array of tasks to execute
 * @param limit - The maximum number of tasks to run concurrently
 * @param options - The options for the inner TaskQueue
 */
export declare function parallelLimit<T>(tasks: Array<AsyncTask<T>>, limit: number, options?: QueueOptions): Promise<T[]>;

/**
 * @public
 *
 * Sames as {@link parallel} but limit the number of tasks that run concurrently.
 *
 * @param tasks - An object that contains AsyncTask
 * @param limit - The maximum number of tasks to run concurrently
 * @param options - The options for the inner Queue
 */
export declare function parallelLimit<T extends Record<string, unknown>>(tasks: T, limit: number, options?: QueueOptions): Promise<AwaitedObject<T>>;

declare type ParametersWithoutLast<Method extends Func> = RemoveFromEnd<Parameters<Method>, [GetLast<Parameters<Method>>]>;

declare type ParametersWithoutLast2<Method extends Func> = RemoveFromEnd<Parameters<Method>, [GetLast2<Parameters<Method>>, GetLast<Parameters<Method>>]>;

/**
 * @public
 *
 * Create a new function which exec `task` by combining arguments.
 *
 * @param task - the function to partialize
 * @param preArgs - arguments to bind to task
 */
export declare function partial<Method extends Func, Arguments extends PartialParameters<Method>>(task: Method, ...preArgs: Arguments): (...args: RestOfParameters<Method, Arguments>) => Async<ReturnType<Method>>;

/**
 * @public
 *
 * Same as {@link partial} but call the `task` with `owner` `this` context.
 * If task is a string, it calls `owner[task]` function.
 *
 * @param owner - `this` context to use when calling `task`
 * @param task - The property name of function in `owner`
 * @param args - The `task` arguments
 */
export declare function partialOn<O, Key extends MethodNames<O>, Arguments extends PartialParameters<O[Key]>>(owner: O, task: Key, ...args: Arguments): (...args: RestOfParameters<O[Key], Arguments>) => Async<ReturnType<O[Key]>>;

/**
 * @public
 *
 * Same as {@link partial} but call the `task` with `owner` `this` context
 *
 * @param owner - `this` context to use when calling `task`
 * @param task - The function to partialize
 * @param args - The `task` arguments
 */
export declare function partialOn<O, Method extends Func, Arguments extends PartialParameters<Method>>(owner: O, task: Method, ...args: Arguments): (...args: RestOfParameters<Method, Arguments>) => Async<ReturnType<Method>>;

declare type PartialParameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? Partial<P> : never;

declare type PreviousIndex<T extends number> = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62][T];

/**
 * @public
 *
 * A PriorityQueue is like a {@link Queue} but executes items in priority order.
 */
export declare class PriorityQueue<T, U> extends Queue<T, U> {
    defaultPriority: number;
    protected items: Array<PriorityQueueItem<T, U>>;
    /**
     * Creates a new PriorityQueue.
     *
     * @param worker - The worker function to apply on each item in PriorityQueue
     * @param limit - The maximum number of concurrent workers to launch
     * @param options - The options for the PriorityQueue
     */
    constructor(worker: (arg: T) => U | Promise<U>, limit?: number, options?: PriorityQueueOptions);
    push(priority: number, data?: T): Promise<U>;
    push(priority: number, datas: T[]): Promise<U[]>;
    push(priority: number, ...datas: T[]): Promise<U[]>;
    push(data: T): Promise<U>;
    push(datas: T[]): Promise<U[]>;
    push(...datas: T[]): Promise<U[]>;
    unshift(priority: number, data?: T): Promise<U>;
    unshift(priority: number, datas: T[]): Promise<U[]>;
    unshift(priority: number, ...datas: T[]): Promise<U[]>;
    unshift(data: T): Promise<U>;
    unshift(datas: T[]): Promise<U[]>;
    unshift(...datas: T[]): Promise<U[]>;
    private insertAt;
    private binarySearch;
    private compareTasks;
}

declare type PriorityQueueItem<T, P> = Queue<T, P>["items"][number] & {
    priority?: number;
};

/**
 * @public
 * Options to create a PriorityQueue.
 */
export declare interface PriorityQueueOptions extends QueueOptions {
    defaultPriority?: number;
}

/**
 * @public
 *
 * The same as {@link PriorityQueue} but items are the tasks to execute.
 */
export declare class PriorityTaskQueue<T> extends PriorityQueue<AsyncTask<T>, T> {
    /**
     * Creates a new PriorityTaskQueue.
     *
     * @param limit - The maximum number of concurrent tasks to launch
     * @param options - The options for the PriorityTaskQueue
     */
    constructor(limit?: number, options?: PriorityQueueOptions);
}

declare type ProgressItems<T extends readonly unknown[]> = {
    [K in keyof T]: T[K] extends ProgressPromise<unknown, infer R> ? R : undefined;
};

/**
 * @public
 *
 * A ProgressPromise is a special Promise which allows to track progress of the inner process.
 */
export declare class ProgressPromise<T, P> implements PromiseLike<T> {
    protected _innerPromise: Promise<T>;
    protected _progress: P | undefined;
    protected _progressesCallbacks: Array<(progress: P) => void> | undefined;
    constructor(executor: ProgressPromiseExecutor<T, P>);
    /**
     * Adds a progress callback who listen to progress evolution of the `ProgressPromise`.
     *
     * @param onprogress - The callback to execute when the ProgressPromise progress changed.
     * @returns - This Promise
     */
    progress(onprogress?: (progress: P) => void): this;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     *
     * @param onfulfilled - The callback to execute when the Promise is resolved.
     * @param onrejected - The callback to execute when the Promise is rejected.
     *
     * @returns - A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     *
     * @param onrejected - The callback to execute when the Promise is rejected.
     *
     * @returns - A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the `Promise` is settled (fulfilled or rejected).
     * The resolved value cannot be modified from the callback.
     *
     * @param onfinally - The callback to execute when the `Promise` is settled (`fulfilled` or `rejected`).
     * @returns - A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): Promise<T>;
    /**
     * Returns a new ProgressPromiseDeferred object.
     */
    static defer<T, P>(): ProgressPromiseDeferred<T, P>;
    /**
     * Creates a `ProgressPromise` that is resolved with an array of results when all of the provided Promises resolve, or rejected when any Promise is rejected.
     *
     * The `progress` function returns an array of all progresses from found ProgressPromises in `values`.
     *
     * @param values - An array of Promises.
     * @returns - A new Promise.
     */
    static all<Args extends readonly unknown[]>(values: [...Args]): ProgressPromise<AwaitedTuple<Args>, ProgressItems<Args>>;
    /**
     * Creates a Promise that is resolved or rejected when any of the provided Promises are resolved or rejected.
     * The `progress` function returns an array of all progresses from found ProgressPromises in `values`.
     *
     * @param values - An array of Promises.
     * @returns - A new Promise.
     */
    static race<Args extends readonly unknown[]>(promises: Args): ProgressPromise<Awaited<Args[number]>, ProgressItems<Args>>;
    private cleaner;
    private createProgressFunction;
}

declare interface ProgressPromiseDeferred<T, P> {
    resolve(val?: T | PromiseLike<T>): void;
    reject(err?: any): void;
    progress(val: P): void;
    promise: ProgressPromise<T, P>;
}

declare type ProgressPromiseExecutor<T, P> = (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void, progress: (progress: P) => void) => void;

/**
 * @public
 *
 * Build a function that transform a Node-Style callback function to a Promise version.
 *
 * @param fn - The function to promisify
 */
export declare function promisify<T extends FunctionWithNodeStyleCallback>(fn: T): (...args: ParametersWithoutLast<T>) => Async<FunctionWithNodeStyleCallbackReturnType<T>>;

/**
 * @public
 *
 * Build a function that transform a Node-Style callback function to a Promise version.
 *
 * @param owner - The `this` context to use when calling `fn`
 * @param fn - The function to promisify
 */
export declare function promisify<O, T extends FunctionWithNodeStyleCallback>(owner: O, fn: T): (...args: ParametersWithoutLast<T>) => Async<FunctionWithNodeStyleCallbackReturnType<T>>;

/**
 * @public
 *
 * A Queue runs a `worker` function on each item that it contains but limit the number of concurrent runs.
 */
export declare class Queue<T, U> {
    protected items: Array<QueueItem<T, U>>;
    protected worker: (arg: T) => U | Promise<U>;
    protected workers: number;
    protected started: boolean;
    protected paused: boolean;
    protected hasException: boolean;
    limit: number;
    onempty: (() => any) | undefined;
    ondrain: (() => any) | undefined;
    onsaturated: (() => any) | undefined;
    stopOnError: boolean;
    waitToReject: boolean;
    get length(): number;
    get running(): boolean;
    get idle(): boolean;
    /**
     * Creates a new Queue.
     *
     * @param worker - The worker function to apply on each item in Queue
     * @param limit - The maximum number of concurrent workers to launch
     * @param options - The options for the Queue
     */
    constructor(worker: (arg: T) => U | Promise<U>, limit?: number, options?: QueueOptions);
    push(data: T): Promise<U>;
    push(datas: T[]): Promise<U[]>;
    push(...datas: T[]): Promise<U[]>;
    unshift(data: T): Promise<U>;
    unshift(datas: T[]): Promise<U[]>;
    unshift(...datas: T[]): Promise<U[]>;
    pause(): void;
    resume(): void;
    clear(): void;
    private insert;
    protected createItem(data: T, results: U[], errors: any[], count: number, resolve: (result: U | U[] | PromiseLike<U | U[]>) => void, reject: (err?: any) => void): QueueItem<T, U>;
    protected process(): void;
    private createItemProcess;
    protected onProcessEnd(): void;
}

/**
 * @public
 *
 * An Error that is thrown when a Queue execution fails and `waitToReject` option is set to true.
 */
export declare class QueueError<T> extends Error {
    innerErrors: Error[];
    results: T[];
    constructor(innerErrors: Error[], results: T[]);
}

declare type QueueItem<T, U> = {
    data: T;
    priority?: number;
    resolver(result: U): void;
    rejecter(err: Error): void;
};

/**
 * @public
 * Options to create a Queue.
 */
export declare interface QueueOptions {
    onempty?: (() => any) | undefined;
    ondrain?: (() => any) | undefined;
    onsaturated?: (() => any) | undefined;
    stopOnError?: boolean;
    waitToReject?: boolean;
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
export declare function reduce<T, U>(array: T[], memo: U, iterator: AsyncReduceIterator<T, U>): Promise<U>;

/**
 * @public
 *
 * Same as {@link reduce}, only operates on `array` in reverse order.
 *
 * @param array - The array to iterate on
 * @param memo - The starting value for the reduce operation
 * @param iterator - The function that reduce each item and return the reduced result
 */
export declare function reduceRight<T, U>(array: T[], memo: U, iterator: AsyncReduceIterator<T, U>): Promise<U>;

/**
 * @public
 *
 * The opposite of {@link filter}.
 * Removes values that pass an `async` truth test.
 *
 * @param array - The array to iterate on
 * @param iterator - The iterator which test each item
 */
export declare function reject<T>(array: T[], iterator: AsyncListIterator<T, boolean>): Promise<T[]>;

/**
 * @public
 *
 * The same as {@link reject}, only the `iterator` is applied to each item in `array` in series.
 *
 * @param array - The array to iterate on
 * @param iterator - The iterator which test each item
 */
export declare function rejectSeries<T>(array: T[], iterator: AsyncListIterator<T, boolean>): Promise<T[]>;

declare type RemoveFromEnd<Tuple extends readonly any[], ToRemove extends readonly any[]> = Tuple extends [...result: infer Result, ...end: ToRemove] ? Result : Tuple;

declare type RemoveFromStart<Tuple extends readonly any[], ToRemove extends readonly any[]> = Tuple extends [...start: ToRemove, ...result: infer Result] ? Result : Tuple;

/**
 * @public
 *
 * Alias for `Promise.resolve`.
 */
export declare const resolve: {
    <T>(value: T | PromiseLike<T>): Promise<T>;
    (): Promise<void>;
};

declare type RestOfParameters<Method extends (...args: any[]) => any, UsedParameters extends any[]> = RemoveFromStart<Parameters<Method>, UsedParameters>;

/**
 * @public
 *
 * Executes the `task` and retry if failed.
 * If `task` fails the given number of `times`, the promise is rejected.
 *
 * @param times - The number of times the `task` should be retried
 * @param task - The task to retry if it fails
 */
export declare function retry<T>(times: number, task: AsyncTask<T>): Promise<T>;

/**
 * @public
 *
 * Prepare a new function that transfer its arguments to the fist `task` then calls each `task` using the result of the previous `task`.
 * Resolves with the result of the last `task`.
 * Note: Execution order if from start to end.
 *
 * @param tasks - Functions to be run from start to end
 */
export declare function seq<T extends AsyncFunction[]>(...tasks: T): (...args: Parameters<GetFirst<T>>) => Async<GetLastReturnType<T>>;

/**
 * @public
 *
 * Run given tasks in parallel and resolves with an array of the results of each task.
 *
 * @param tasks - The array of functions to execute in parallel
 */
export declare function series<T>(tasks: Array<AsyncTask<T>>): Promise<T[]>;

/**
 * @public
 *
 * Run found tasks in given object in series and resolves with an object where all tasks are resolved to their values.
 *
 * @param obj - The object which contains tasks to execute in parallel
 */
export declare function series<T extends Record<string, unknown>>(tasks: T): Promise<AwaitedObject<T>>;

declare type SimpleCallback<T = any> = (...args: T[]) => any;

declare type SimpleCallbackResultType<T extends SimpleCallback> = T extends () => any ? void : T extends (arg: infer Result) => any ? Result : T extends (...args: infer Results) => any ? Results : void;

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
export declare function some<T>(array: T[], iterator: AsyncListIterator<T, boolean>): Promise<boolean>;

/**
 * @public
 *
 * Sorts a list by the results of running each `array` value through an async `iterator`.
 *
 * @param array - The array to iterate on
 * @param iterator - The function which returns the sort index
 */
export declare function sortBy<T, U>(array: T[], iterator: AsyncListIterator<T, U>): Promise<T[]>;

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
export declare function tap<Task extends AsyncFunction>(task: Task, ...args: Parameters<Task>): <U>(arg: U) => Promise<U>;

/**
 * @public
 *
 * The sames as {@link tap} but apply the `task` with `owner` as this context.
 *
 * @param owner - The this context to apply when calling the task
 * @param task - The key on owner that contains the function to be called during tap
 * @param args - The arguments to apply to task
 */
export declare function tapOn<O, K extends MethodNames<O>>(owner: O, task: K, ...args: Parameters<O[K]>): <U>(arg: U) => Promise<U>;

/**
 * @public
 *
 * The sames as {@link tap} but apply the `task` with `owner` as this context.
 *
 * @param owner - The this context to apply when calling the task
 * @param task - The function to be called during tap
 * @param args - The arguments to apply to task
 */
export declare function tapOn<O, T extends AsyncFunction>(owner: O, task: T, ...args: Parameters<T>): <U>(arg: U) => Promise<U>;

/**
 * @public
 *
 * The same as {@link Queue} but items are the tasks to execute.
 */
export declare class TaskQueue<T> extends Queue<AsyncTask<T>, T> {
    /**
     * Creates a new  TaskQueue.
     *
     * @param limit - The maximum number of concurrent tasks to launch
     * @param options - The options for the TaskQueue
     */
    constructor(limit?: number, options?: QueueOptions);
}

/**
 * @public
 *
 * Returns a Promise that resolves when timer is done.
 *
 * @param ms - Milliseconds to wait before resolving the Promise
 */
export declare function timeout(ms?: number): Promise<void>;

/**
 * @public
 *
 * Executes `task` the given number of `times`.
 * Returns an array with the result of each `task` execution.
 *
 * @param times - The number of times `task` should be called
 * @param task - The task to run multiple times
 */
export declare function times<T>(times: number, task: AsyncTask<T>): Promise<T[]>;

/**
 * @public
 *
 * The same as {@link times}, only `tasks` are applied in series.
 * The next `task` is only called once the current one has completed.
 *
 * @param times - The number of times `task` should be called
 * @param task - The task to run multiple times
 */
export declare function timesSeries<T>(times: number, task: AsyncTask<T>): Promise<T[]>;

/**
 * @public
 *
 * Same as {@link cbpromisify} but call the function immediately.
 *
 * @param fn - The function to promisify
 * @param args - The arguments to pass to fn
 */
export declare function uncallbackify<T extends FunctionWithMultiCallbacks>(fn: T, ...args: ParametersWithoutLast2<T>): Async<FunctionWithMultiCallbacksReturnType<T>>;

/**
 * @public
 *
 * Same as {@link promisify} but call the function immediately.
 *
 * @param owner - The `this` context to use when calling fn
 * @param fn - The function to promisify
 * @param args - The arguments to pass to fn
 */
export declare function uncallbackify<O extends Record<string, unknown>, T extends FunctionWithMultiCallbacks>(owner: O, fn: T, ...args: ParametersWithoutLast2<T>): Async<FunctionWithMultiCallbacksReturnType<T>>;

/**
 * @public
 *
 * The opposite of {@link whilst}.
 * Calls the `task` function until the `test` function returns `true`.
 *
 * @param test - The function that test if the process should continue
 * @param task - The task to execute while `test` fails
 */
export declare function until<T>(test: AsyncTask<boolean>, task: AsyncTask<T>): Promise<void>;

/**
 * @public
 *
 * Calls each `task` using the result of the previous `task`.
 * Resolves with the result of the last `task`.
 * The first `task` should not take any argument.
 *
 * @param tasks - Functions to run in order
 */
export declare function waterfall<T extends AsyncFunction[]>(tasks: T): Async<GetLastReturnType<T>>;

/**
 * @public
 *
 * Equivalent of `while` loop.
 * Calls the `task` function while the `test` function returns `true`.
 *
 * @param test - The function that test if the process should continue
 * @param task - The task to execute while `test` pass
 */
export declare function whilst<T>(test: AsyncTask<boolean>, task: AsyncTask<T>): Promise<void>;

export { }
