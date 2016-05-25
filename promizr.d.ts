
declare module promizr {
/// <reference path="../_definitions.d.ts" />
/** A function that return a Promise */
export interface PromiseTaskExecutor<T> {
    (...args: any[]): Promise<T>;
}
/** Base List Iterator for promizr */
export interface PromiseListIterator<T, U> {
    (item: T, index: number, list: T[]): Promise<U>;
}
/** Iterator for promizr.reduce */
export interface PromiseReduceIterator<T> {
    (memo: T, item: T): Promise<T>;
}
/**
 * Applies the function  iterator  to each item in  arr , in parallel.
 * The  iterator  is called with an item from the list, the index of this item and the list itself.
 * If the  iterator  emit a rejected Promise, the each function Promise result is instantly rejected.
 *
 * Note, that since this function applies  iterator  to each item in parallel, there is no guarantee that the iterator functions will complete in order.
 */
export function each<T>(array: T[], iterator: PromiseListIterator<T, any>): Promise<void>;
/**
 * The same as  each , only  iterator  is applied to each item in  array  in series.
 * The next  iterator  is only called once the current one has completed.
 * This means the  iterator  functions will complete in order.
 */
export function eachSeries<T>(array: T[], iterator: PromiseListIterator<T, any>): Promise<void>;
/**
 * Produces a new array of values by mapping each value in  array  through the  iterator  function.
 * The  iterator  is called with an item from the list, the index of this item and the list itself.
 * If the  iterator  emit a rejected Promise, the each function Promise result is instantly rejected.
 *
 * Note, that since this function applies the  iterator  to each item in parallel, there is no guarantee that the  iterator  functions will complete in order.
 * However, the results array will be in the same order as the original  arr .
 */
export function map<T, U>(array: T[], iterator: PromiseListIterator<T, U>): Promise<U[]>;
/**
 * The same as  map , only the  iterator  is applied to each item in  array  in series.
 * The next  iterator  is only called once the current one has completed.
 * The results array will be in the same order as the original.
 */
export function mapSeries<T, U>(array: T[], iterator: PromiseListIterator<T, U>): Promise<U[]>;
/**
 * Returns a new array of all the values in  array  which pass an async truth test.
 * The Promise returned by each  iterator  call can only returns boolean value!
 * This operation is performed in parallel, but the results array will be in the same order as the original.
 */
export function filter<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T[]>;
/**
 * The same as  filter  only the  iterator  is applied to each item in  array  in series.
 * The next  iterator  is only called once the current one has completed.
 * The results array will be in the same order as the original.
 */
export function filterSeries<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T[]>;
/**
 * The opposite of  filter . Removes values that pass an  async  truth test.
 */
export function reject<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T[]>;
/**
 * The same as  reject , only the  iterator  is applied to each item in  array  in series.
 */
export function rejectSeries<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T[]>;
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
export function reduce<T>(array: T[], memo: T, iterator: PromiseReduceIterator<T>): Promise<T>;
/**
 * Same as  reduce , only operates on  array  in reverse order.
 */
export function reduceRight<T>(array: T[], memo: T, iterator: PromiseReduceIterator<T>): Promise<T>;
/**
 * Returns the first value in  array  that passes an async truth test.
 * The  iterator  is applied in parallel, meaning the first iterator to return  true  resolve the global  find  Promise.
 * That means the result might not be the first item in the original  array  (in terms of order) that passes the test.
 * If order within the original  array  is important, then look at  findSeries .
 */
export function find<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T>;
/**
 * The same as  find , only the  iterator  is applied to each item in  array  in series.
 * This means the result is always the first in the original  array  (in terms of array order) that passes the truth test.
 */
export function findSeries<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T>;
/**
 * Sorts a list by the results of running each  array  value through an async  iterator .
 */
export function sortBy<T, U>(array: T[], iterator: PromiseListIterator<T, U>): Promise<T[]>;
/**
 * Returns  true  if at least one element in the  array  satisfies an async test.
 * The Promise returned by each  iterator  call can only returns boolean value!
 * Once any iterator call returns  true , the main Promise is resolved.
 */
export function some<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<boolean>;
/**
 * Returns  true  if every element in  array  satisfies an async test.
 */
export function every<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<boolean>;
/**
 * Applies  iterator  to each item in  array , concatenating the results.
 * Returns the concatenated list.
 *
 * The  iterator s are called in parallel, and the results are concatenated as they return.
 * There is no guarantee that the results array will be returned in the original order of  array  passed to the  iterator  function.
 */
export function concat<T, U>(array: T[], iterator: PromiseListIterator<T, U[]>): Promise<U[]>;
/**
 * Same as  concat , but executes in series instead of parallel.
 */
export function concatSeries<T, U>(array: T[], iterator: PromiseListIterator<T, U[]>): Promise<U[]>;

/// <reference path="../_definitions.d.ts" />
export interface PromiseTaskExecutorObject<T> {
    [key: string]: () => Promise<T>;
}
export interface PromiseSeriesObjectResult<T> {
    [key: string]: T;
}
export function series<T>(tasks: PromiseTaskExecutor<T>[]): Promise<T[]>;
export function series<T>(tasks: PromiseTaskExecutorObject<T>): Promise<PromiseSeriesObjectResult<T>>;
export function parallel<T>(tasks: PromiseTaskExecutor<T>[]): Promise<T[]>;
export function parallel<T>(tasks: PromiseTaskExecutorObject<T>): Promise<PromiseSeriesObjectResult<T>>;
export function whilst<T>(test: () => boolean, task: PromiseTaskExecutor<T>): Promise<void>;
export function doWhilst<T>(executor: PromiseTaskExecutor<T>, test: (res?: T) => boolean): Promise<void>;
export function until<T>(test: () => boolean, task: PromiseTaskExecutor<T>): Promise<void>;
export function doUntil<T>(task: PromiseTaskExecutor<T>, test: (res?: T) => boolean): Promise<void>;
export function forever<T>(task: PromiseTaskExecutor<T>): Promise<void>;
export function waterfall<T>(tasks: PromiseTaskExecutor<any>[]): Promise<T>;
export function compose<T>(...tasks: PromiseTaskExecutor<any>[]): PromiseTaskExecutor<T>;
export function seq<T>(...tasks: PromiseTaskExecutor<any>[]): PromiseTaskExecutor<T>;
export function applyEach<T>(tasks: PromiseTaskExecutor<T>[], ...args: any[]): PromiseTaskExecutor<T[]> | Promise<T[]>;
export function applyEachSeries<T>(tasks: PromiseTaskExecutor<T>[], ...args: any[]): PromiseTaskExecutor<T[]> | Promise<T[]>;
export function retry<T>(times: number, task: PromiseTaskExecutor<T>): Promise<T>;
export function times<T>(times: number, task: PromiseTaskExecutor<T>): Promise<T[]>;
export function timesSeries<T>(times: number, task: PromiseTaskExecutor<T>): Promise<T[]>;

/// <reference path="../_definitions.d.ts" />
export var nextTick: (cb: Function) => void;

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
export type ProgressPromiseable<T, P> = T | Thenable<T> | ProgressPromise<T, P>;
export class ProgressPromise<T, P> implements Thenable<T> {
    _innerPromise: Promise<T>;
    _progress: P;
    _progressesCallbacks: ProgressPromiseCallback<P>[];
    constructor(executor: ProgressPromiseExecutor<T, P>);
    progress(onProgress: ProgressPromiseCallback<P>): ProgressPromise<T, P>;
    /**
     * Create a new Promise by chaining given callback to current Promise
     * @param {PromiseCallback} onFulfilled Callback to be called when Promise fulfills
     * @param {PromiseCallback} [onRejected] Callback to be called when Promise fails
     * @returns {Promise} Chained Promise
     */
    then<U>(onFulfilled: (value: T) => U | Thenable<U>): Promise<U>;
    then<U>(onFulfilled: (value: T) => U | Thenable<U>, onRejected: (err?: any) => void | U): Promise<U>;
    /**
     * The catch function allows to apply a callback on rejection handler.
     * It is equivalent to promise.then(undefined, onRejected)
     * @param {PromiseCallback} onRejected callback to be called whenever promise fail
     * @returns {Promise} A chained Promise which handle error and fullfil
     */
    catch<U>(onRejected: (err?: any) => void | U): Promise<U>;
    static defer<T, P>(): ProgressPromiseDeferred<T, P>;
    static all<T, P>(promises: ProgressPromiseable<T, P>[]): ProgressPromise<T[], P[]>;
    static race<T, P>(promises: ProgressPromiseable<T, P>[]): ProgressPromise<T, P[]>;
}

/// <reference path="../_definitions.d.ts" />
export interface QueueItemOptions<T, U> {
    data?: T;
    priority?: number;
}
export interface QueueItem<T, U> extends QueueItemOptions<T, U> {
    resolver(result: U): void;
    rejecter(err: Error): void;
}
export interface QueueWorker<T, U> {
    (arg: T): Promise<U>;
}
export interface QueueError extends Error {
    innerException?: Error | any;
    innerExceptions?: Error[] | any[];
}
export class Queue<T, U> {
    protected worker: QueueWorker<T, U>;
    limit: number;
    protected items: QueueItem<T, U>[];
    protected workers: number;
    protected started: boolean;
    protected paused: boolean;
    protected hasException: boolean;
    onempty: Function;
    ondrain: Function;
    onsaturated: Function;
    stopOnError: boolean;
    waitToReject: boolean;
    constructor(worker: QueueWorker<T, U>, limit?: number, list?: T[]);
    push(data: T): Promise<U>;
    push(datas: T[]): Promise<U[]>;
    push(...datas: T[]): Promise<U[]>;
    unshift(data: T): Promise<U>;
    unshift(datas: T[]): Promise<U[]>;
    unshift(...datas: T[]): Promise<U[]>;
    length(): number;
    running(): boolean;
    idle(): boolean;
    pause(): void;
    resume(): void;
    clear(): void;
    private insert(datas, before?);
    protected createItem(data: T, results: U[], errors: any[], count: number, resolve: (result: U | U[] | PromiseLike<U | U[]>) => void, reject: (err?: any) => void): QueueItem<T, U>;
    protected process(): void;
    protected onProcessEnd(): void;
}
export class PriorityQueue<T, U> extends Queue<T, U> {
    defaultPriority: number;
    constructor(worker: QueueWorker<T, U>, limit?: number, list?: T[]);
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
    private insertAt(datas, priority);
    private binarySearch(seq, item, compare);
    private compareTasks(a, b);
}
export class TaskQueue<T> extends Queue<PromiseTaskExecutor<T>, T> {
    constructor(limit?: number, list?: PromiseTaskExecutor<T>[]);
}
export class PriorityTaskQueue<T> extends PriorityQueue<PromiseTaskExecutor<T>, T> {
    constructor(limit?: number, list?: PromiseTaskExecutor<T>[]);
}
export function queue<T, U>(worker: QueueWorker<T, U>, limit?: number, list?: T[]): Queue<T, U>;
export function priorityQueue<T, U>(worker: QueueWorker<T, U>, limit?: number, list?: T[]): PriorityQueue<T, U>;
export function taskQueue<T>(limit?: number, list?: PromiseTaskExecutor<T>[]): TaskQueue<T>;
export function priorityTaskQueue<T>(limit?: number, list?: PromiseTaskExecutor<T>[]): PriorityTaskQueue<T>;
export function eachLimit<T>(array: T[], limit: number, iterator: PromiseListIterator<T, any>): Promise<void>;
export function mapLimit<T, U>(array: T[], limit: number, iterator: PromiseListIterator<T, U>): Promise<U[]>;
export function parallelLimit<T>(tasks: PromiseTaskExecutor<T>[], limit: number): Promise<T[]>;
export function parallelLimit<T>(tasks: PromiseTaskExecutorObject<T>, limit: number): Promise<PromiseSeriesObjectResult<T>>;

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
export function apply<T>(task: TypedFunction<T>, ...args: any[]): TypedFunction<T>;
export function applyOn<T>(owner: any, task: string | TypedFunction<T>, ...args: any[]): TypedFunction<T>;
export function partial<T>(task: TypedFunction<T>, ...args: any[]): TypedFunction<T>;
export function partialOn<T>(owner: any, task: string | TypedFunction<T>, ...args: any[]): TypedFunction<T>;
export function tap<T, U>(task: TypedFunction<T>, ...args: any[]): (arg: U) => U;
export function tapOn<T, U>(owner: any, task: string | TypedFunction<T>, ...args: any[]): (arg: U) => U;
export function memoize<T>(task: PromiseTaskExecutor<T>, hash?: boolean | HashFunction): PromiseTaskExecutor<T>;
export function log<T>(task: PromiseTaskExecutor<T>, ...args: any[]): Promise<T>;
export function dir<T>(task: PromiseTaskExecutor<T>, ...args: any[]): Promise<T>;
export function timeout(ms?: number): Promise<void>;
export function immediate(): Promise<void>;
export function module<T>(name: string): Promise<T>;
export function module<T>(names: string[]): Promise<T[]>;
export function module<T>(...names: string[]): Promise<T[]>;
export function denodify<T>(owner: any, fn: Function, ...args: any[]): Promise<T>;
export function denodify<T>(fn: Function, ...args: any[]): Promise<T>;
export function uncallbackify<T>(owner: any, fn: Function, ...args: any[]): Promise<T>;
export function uncallbackify<T>(fn: Function, ...args: any[]): Promise<T>;
export function defer<T>(): Deferred<T>;
export function polyfill(): PromiseConstructorLike;

}

declare module "promizr" {
    import p = promizr;
    export = p;
}

declare var pzr: typeof promizr;
