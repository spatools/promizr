/// <reference path="./promise.d.ts" />

declare module promizr {
/// <reference path="../_definitions.d.ts" />
export interface PromiseTaskExecutor<T> {
    (...args: any[]): Promise<T>;
}
export interface PromiseListIterator<T, U> {
    (item: T, index: number, list: T[]): Promise<U>;
}
export interface PromiseReduceIterator<T> {
    (memo: T, item: T): Promise<T>;
}
export function each<T>(array: T[], iterator: PromiseListIterator<T, any>): Promise<void>;
export function eachSeries<T>(array: T[], iterator: PromiseListIterator<T, any>): Promise<void>;
export function map<T, U>(array: T[], iterator: PromiseListIterator<T, U>): Promise<U[]>;
export function mapSeries<T, U>(array: T[], iterator: PromiseListIterator<T, U>): Promise<U[]>;
export function filter<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T[]>;
export function filterSeries<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T[]>;
export function reject<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T[]>;
export function rejectSeries<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T[]>;
export function reduce<T>(array: T[], memo: T, iterator: PromiseReduceIterator<T>): Promise<T>;
export function reduceRight<T>(array: T[], memo: T, iterator: PromiseReduceIterator<T>): Promise<T>;
export function find<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T>;
export function findSeries<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T>;
export function sortBy<T, U>(array: T[], iterator: PromiseListIterator<T, U>): Promise<T[]>;
export function some<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<boolean>;
export function every<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<boolean>;
export function concat<T, U>(array: T[], iterator: PromiseListIterator<T, U[]>): Promise<U[]>;
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
export interface QueueItem<T, U> {
    data?: T;
    priority?: number;
    resolver?(result: U): void;
}
export interface QueueWorker<T, U> {
    (arg: T): Promise<U>;
}
export class Queue<T, U> {
    protected items: QueueItem<T, U>[];
    protected limit: number;
    protected worker: QueueWorker<T, U>;
    protected workers: number;
    protected started: boolean;
    protected paused: boolean;
    onempty: Function;
    ondrain: Function;
    onsaturated: Function;
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
    protected process(): void;
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
export function defer<T>(): PromiseCapability<T>;
export function polyfill(): typeof Promise;

}

declare module "promizr" {
    import p = promizr;
    export = p;
}

declare var pzr: typeof promizr;
