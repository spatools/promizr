/**
 * @public
 * A function that take no arguments and may return a Promise.
 */
export type AsyncTask<T = unknown> = () => T | Promise<T>;

/**
 * @public
 * A function that may return a Promise.
 */
export type AsyncFunction<T = any> = (...args: any[]) => T | Promise<T>;

/**
 * @public
 * Asynchronous list iterator function.
 */
export type AsyncListIterator<T, U> = (item: T, index: number, list: T[]) => U | Promise<U>;

/**
 * @public
 * Asynchronous reduce iterator function.
 */
export type AsyncReduceIterator<T, U> = (memo: U, item: T, index: number, list: T[]) => U | Promise<U>;

/**
 * @public
 * Transform a source object in an object where every AsyncTask is awaited.
 */
export type AwaitedObject<T> = { [K in keyof T]: T[K] extends () => infer R ? Awaited<R> : T[K]; }

/**
 * @public
 * Utility type to extract Promise resolution Type.
 */
export type Awaited<T> = T extends PromiseLike<infer R> ? R : T;

/**
 * @public
 * Utility type to wrap value in a Promise.
 */
export type Async<T> = Promise<Awaited<T>>;

/**
 * @public
 * A Deferred is an object to control a Promise outside of executor.
 */
export type Deferred<T> = {
    resolve(val?: T | PromiseLike<T>): void;
    reject(err?: any): void;

    promise: Promise<T>;
}

/**
 * @public
 * Options to create a Queue.
 */
export interface QueueOptions {
    onempty?: (() => any) | undefined;
    ondrain?: (() => any) | undefined;
    onsaturated?: (() => any) | undefined;

    stopOnError?: boolean;
    waitToReject?: boolean;
}

/**
 * @public
 * Options to create a PriorityQueue.
 */
export interface PriorityQueueOptions extends QueueOptions {
    defaultPriority?: number;
}
