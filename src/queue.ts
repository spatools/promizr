﻿/// <reference path="../_definitions.d.ts" />

export interface QueueItem<T, U> {
    data?: T;
    priority?: number;
    resolver?(result: U): void;
}
export interface QueueWorker<T, U> {
    (arg: T): Promise<U>;
}


export class Queue<T, U> {
    protected items: QueueItem<T, U>[] = [];
    protected limit: number = 1;
    protected worker: QueueWorker<T, U>;
    protected workers: number = 0;

    protected started: boolean = false;
    protected paused: boolean = false;

    public onempty: Function;
    public ondrain: Function;
    public onsaturated: Function;

    constructor(worker: QueueWorker<T, U>, limit?: number, list?: T[]) {
        if (limit) {
            this.limit = limit;
        }

        this.worker = worker;

        if (list && list.length > 0) {
            this.push.apply(this, list);
        }
    }

    public push(data: T): Promise<U>;
    public push(datas: T[]): Promise<U[]>;
    public push(...datas: T[]): Promise<U[]>;
    public push(...datas: any[]): Promise<U|U[]> {
        if (datas.length === 1 && Array.isArray(datas[0])) {
            datas = datas[0];
        }

        return this.insert(datas);
    }

    public unshift(data: T): Promise<U>;
    public unshift(datas: T[]): Promise<U[]>;
    public unshift(...datas: T[]): Promise<U[]>;
    public unshift(...datas: any[]): Promise<U|U[]> {
        if (datas.length === 1 && Array.isArray(datas[0])) {
            datas = datas[0];
        }

        return this.insert(datas, true);
    }

    public length(): number {
        return this.items.length;
    }
    public running(): boolean {
        return this.workers > 0;
    }
    public idle(): boolean {
        return this.items.length + this.workers === 0;
    }

    public pause(): void {
        if (this.paused) {
            return;
        }

        this.paused = true;
    }
    public resume(): void {
        if (!this.paused) {
            return;
        }

        this.paused = false;

        var i = 0, len = this.limit,
            process = this.process.bind(this);

        for (; i < len; i++) {
            nextTick(process);
        }
    }

    public clear(): void {
        this.ondrain = null;
        this.items = [];
    }

    private insert(datas: T[], before?: boolean): Promise<U|U[]> {
        var resolver: PromiseResolveFunction<U|U[]>,
            promise = new Promise(r => { resolver = r; }),

            results: U[] = [],
            process = this.process.bind(this);

        if (datas.length === 0) {
            return Promise.resolve([]);
        }

        if (!this.started) {
            this.started = true;
        }

        function capture(data: T): QueueItem<T, U> {
            nextTick(process);

            return {
                data: data,
                resolver: res => {
                    results.push(res);

                    if (results.length === datas.length) {
                        resolver(results.length === 1 ? results[0] : results);
                    }
                }
            };
        }

        if (before) {
            this.items.unshift.apply(this.items, datas.map(capture, this));
        }
        else {
            this.items.push.apply(this.items, datas.map(capture, this));
        }

        if (this.onsaturated && this.items.length >= this.limit) {
            this.onsaturated();
        }

        return promise;
    }

    protected process(): void {
        if (!this.paused && this.workers < this.limit && this.items.length > 0) {
            var item = this.items.shift();

            if (this.onempty && this.items.length === 0) {
                this.onempty();
            }

            this.workers += 1;
            this.worker(item.data).then(res => {
                this.workers -= 1;

                item.resolver.call(null, res);

                if (this.ondrain && this.items.length + this.workers === 0) {
                    this.ondrain();
                }

                this.process();
            });
        }
    }
}

export class PriorityQueue<T, U> extends Queue<T, U> {
    public defaultPriority: number = 1;

    constructor(worker: QueueWorker<T, U>, limit?: number, list?: T[]) {
        super(worker, limit, list);
    }

    public push(priority: number, data?: T): Promise<U>;
    public push(priority: number, datas: T[]): Promise<U[]>;
    public push(priority: number, ...datas: T[]): Promise<U[]>;
    public push(data: T): Promise<U>;
    public push(datas: T[]): Promise<U[]>;
    public push(...datas: T[]): Promise<U[]>;
    public push(...datas: any[]): Promise<U|U[]> {
        var priority = this.defaultPriority;
        if (typeof datas[0] === "number") {
            priority = datas.shift();
        }

        if (datas.length === 1 && Array.isArray(datas[0])) {
            datas = datas[0];
        }

        return this.insertAt(datas, priority);
    }

    public unshift(priority: number, data?: T): Promise<U>;
    public unshift(priority: number, datas: T[]): Promise<U[]>;
    public unshift(priority: number, ...datas: T[]): Promise<U[]>;
    public unshift(data: T): Promise<U>;
    public unshift(datas: T[]): Promise<U[]>;
    public unshift(...datas: T[]): Promise<U[]>;
    public unshift(...datas: any[]): Promise<U|U[]> {
        var priority = this.defaultPriority;
        if (typeof datas[0] === "number") {
            priority = datas.shift();
        }

        if (datas.length === 1 && Array.isArray(datas[0])) {
            datas = datas[0];
        }

        return this.insertAt(datas, priority);
    }

    private insertAt(datas: T[], priority: number): Promise<U|U[]> {
        if (datas.length === 0) {
            return Promise.resolve([]);
        }

        var resolver: PromiseResolveFunction<U|U[]>,
            promise = new Promise(r => { resolver = r; }),

            results: U[] = [],
            process = this.process.bind(this),
            index = this.binarySearch(this.items, { priority: priority }, this.compareTasks) + 1;

        if (!this.started) {
            this.started = true;
        }

        function capture(data: T): QueueItem<T, U> {
            nextTick(process);

            return {
                priority: priority,
                data: data,
                resolver: res => {
                    results.push(res);

                    if (results.length === datas.length) {
                        resolver(results.length === 1 ? results[0] : results);
                    }
                }
            };
        }


        this.items.splice.apply(this.items, [index, 0].concat<any>(datas.map(capture, this)));

        if (this.onsaturated && this.items.length >= this.limit) {
            this.onsaturated();
        }

        return promise;
    }

    private binarySearch(seq: QueueItem<T, U>[], item: QueueItem<T, U>, compare: (a: QueueItem<T, U>, b: QueueItem<T, U>) => number): number {
        var beg = -1,
            end = seq.length - 1,
            mid: number;

        while (beg < end) {
            mid = beg + ((end - beg + 1) >>> 1);

            if (compare(item, seq[mid]) >= 0) {
                beg = mid;
            }
            else {
                end = mid - 1;
            }
        }

        return beg;
    }
    private compareTasks(a: QueueItem<T, U>, b: QueueItem<T, U>): number {
        return a.priority - b.priority;
    }
}

export class TaskQueue<T> extends Queue<PromiseTaskExecutor<T>, T> {

    constructor(limit?: number, list?: PromiseTaskExecutor<T>[]) {
        super(item => item(), limit, list);
    }

}

export class PriorityTaskQueue<T> extends PriorityQueue<PromiseTaskExecutor<T>, T> {

    constructor(limit?: number, list?: PromiseTaskExecutor<T>[]) {
        super(item => item(), limit, list);
    }

}


export function queue<T, U>(worker: QueueWorker<T, U>, limit?: number, list?: T[]): Queue<T, U> {
    return new Queue(worker, limit, list);
}

export function priorityQueue<T, U>(worker: QueueWorker<T, U>, limit?: number, list?: T[]): PriorityQueue<T, U> {
    return new PriorityQueue(worker, limit, list);
}

export function taskQueue<T>(limit?: number, list?: PromiseTaskExecutor<T>[]): TaskQueue<T> {
    return new TaskQueue(limit, list);
}

export function priorityTaskQueue<T>(limit?: number, list?: PromiseTaskExecutor<T>[]): PriorityTaskQueue<T> {
    return new PriorityTaskQueue(limit, list);
}


export function eachLimit<T>(array: T[], limit: number, iterator: PromiseListIterator<T, any>): Promise<void> {
    var iterators = array.map<PromiseTaskExecutor<any>>((value, index, list) => () => iterator(value, index, list));
    return taskQueue(limit).push(iterators).then(() => { return; });
}

export function mapLimit<T, U>(array: T[], limit: number, iterator: PromiseListIterator<T, U>): Promise<U[]> {
    var iterators = array.map<PromiseTaskExecutor<U>>((value, index, list) => () => iterator(value, index, list));
    return taskQueue<U>(limit).push(iterators);
}

export function parallelLimit<T>(tasks: PromiseTaskExecutor<T>[], limit: number): Promise<T[]>;
export function parallelLimit<T>(tasks: PromiseTaskExecutorObject<T>, limit: number): Promise<PromiseSeriesObjectResult<T>>;
export function parallelLimit<T>(tasks: PromiseTaskExecutor<T>[]|PromiseTaskExecutorObject<T>, limit: number): Promise<T[]|PromiseSeriesObjectResult<T>> {
    if (Array.isArray(tasks)) {
        return taskQueue<T>(limit).push(<PromiseTaskExecutor<T>[]>tasks);
    }

    var obj = <PromiseTaskExecutorObject<T>>tasks,
        data = Object.keys(obj),
        result: any = {};

    function worker(key: string): Promise<void> {
        return obj[key]().then(res => {
            result[key] = res;
        });
    }

    return queue(worker, limit).push(data).then(() => result);
}