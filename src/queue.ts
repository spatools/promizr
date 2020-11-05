import { PromiseListIterator } from "./collections";
import { PromiseTaskExecutor, PromiseTaskExecutorObject, PromizrObjectResult } from "./flow";
import { nextTick } from "./nextTick";

export interface QueueItemOptions<T> {
    data: T;
    priority?: number;
}

export interface QueueItem<T, U> extends QueueItemOptions<T> {
    resolver(result: U): void;
    rejecter(err: Error): void;
}
export interface QueueWorker<T, U> {
    (arg: T): U | Promise<U>;
}

export interface QueueError extends Error {
    innerException?: Error | any;
    innerExceptions?: Error[] | any[];
}

export class Queue<T, U> {
    protected items: Array<QueueItem<T, U>> = [];
    protected workers = 0;

    protected started = false;
    protected paused = false;
    protected hasException = false;

    public onempty: (() => any) | undefined;
    public ondrain: (() => any) | undefined;
    public onsaturated: (() => any) | undefined;

    public stopOnError = false;
    public waitToReject = false;

    constructor(
        protected worker: QueueWorker<T, U>,
        public limit: number = 1,
        list?: T[]) {

        this.process = this.process.bind(this);

        if (list && list.length > 0) {
            this.push(list);
        }
    }

    public push(data: T): Promise<U>;
    public push(datas: T[]): Promise<U[]>;
    public push(...datas: T[]): Promise<U[]>;
    public push(...datas: any[]): Promise<U | U[]> {
        if (datas.length === 1 && Array.isArray(datas[0])) {
            datas = datas[0];
        }

        return this.insert(datas);
    }

    public unshift(data: T): Promise<U>;
    public unshift(datas: T[]): Promise<U[]>;
    public unshift(...datas: T[]): Promise<U[]>;
    public unshift(...datas: any[]): Promise<U | U[]> {
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
        if (!this.paused || !this.hasException) {
            return;
        }

        this.paused = false;
        this.hasException = false;

        const len = this.limit;
        const process = this.process.bind(this);

        for (let i = 0; i < len; i++) {
            nextTick(process);
        }
    }

    public clear(): void {
        this.ondrain = undefined;
        this.items = [];
    }

    private insert(datas: T[], before?: boolean): Promise<U | U[]> {
        let resolver: (result?: U | U[] | PromiseLike<U | U[]>) => void,
            rejecter: (err?: any) => void;

        const
            promise = new Promise<U | U[]>((res, rej) => { resolver = res; rejecter = rej; }),
            length = datas.length,
            errors: any[] = [],
            results: U[] = [];

        if (length === 0) {
            return Promise.resolve([]);
        }

        if (!this.started) {
            this.started = true;
        }

        if (before) this.items.unshift(...datas.map(capture, this));
        else this.items.push(...datas.map(capture, this));

        if (this.onsaturated && this.items.length >= this.limit) {
            this.onsaturated();
        }

        return promise;

        function capture(this: Queue<T, U>, data: T): QueueItem<T, U> {
            nextTick(() => this.process);
            return this.createItem(data, results, errors, length, resolver, rejecter);
        }
    }

    protected createItem(data: T, results: U[], errors: any[], count: number, resolve: (result: U | U[] | PromiseLike<U | U[]>) => void, reject: (err?: any) => void): QueueItem<T, U> {
        return {
            data: data,
            resolver: res => {
                results.push(res);

                if (results.length === count) {
                    resolve(count === 1 ? results[0] : results);
                }
            },
            rejecter: err => {
                if (!this.waitToReject) {
                    return reject(err);
                }

                errors.push(err);

                if (errors.length + results.length === count) {
                    const error: QueueError = new Error("Queue worker exception");

                    count === 1 ?
                        error.innerException = errors[0] :
                        error.innerExceptions = errors;

                    reject(error);
                }
            }
        };
    }

    protected process(): void {
        if (!this.paused && this.workers < this.limit && this.items.length > 0 && !(this.stopOnError && this.hasException)) {
            const item = this.items.shift();
            if (!item) {
                return;
            }

            if (this.onempty && this.items.length === 0) {
                this.onempty();
            }

            this.workers += 1;
            Promise.resolve(this.worker(item.data)).then(
                res => {
                    item.resolver.call(undefined, res);
                    this.onProcessEnd();
                },
                err => {
                    item.rejecter.call(undefined, err);
                    this.hasException = true;
                    this.onProcessEnd();
                }
            );
        }
    }

    protected onProcessEnd(): void {
        this.workers -= 1;

        if (this.ondrain && this.items.length + this.workers === 0) {
            this.ondrain();
        }

        this.process();
    }
}

export class PriorityQueue<T, U> extends Queue<T, U> {
    public defaultPriority = 1;

    constructor(worker: QueueWorker<T, U>, limit?: number, list?: T[]) {
        super(worker, limit, list);
    }

    public push(priority: number, data?: T): Promise<U>;
    public push(priority: number, datas: T[]): Promise<U[]>;
    public push(priority: number, ...datas: T[]): Promise<U[]>;
    public push(data: T): Promise<U>;
    public push(datas: T[]): Promise<U[]>;
    public push(...datas: T[]): Promise<U[]>;
    public push(...datas: any[]): Promise<U | U[]> {
        let priority = this.defaultPriority;
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
    public unshift(...datas: any[]): Promise<U | U[]> {
        let priority = this.defaultPriority;
        if (typeof datas[0] === "number") {
            priority = datas.shift();
        }

        if (datas.length === 1 && Array.isArray(datas[0])) {
            datas = datas[0];
        }

        return this.insertAt(datas, priority);
    }

    private insertAt(datas: T[], priority: number): Promise<U | U[]> {
        const length = datas.length;
        if (length === 0) {
            return Promise.resolve([]);
        }

        let resolver: (result?: U | U[] | PromiseLike<U | U[]>) => void,
            rejecter: (err?: any) => void;

        const
            promise = new Promise<U | U[]>((res, rej) => { resolver = res; rejecter = rej; }),
            errors: any[] = [],
            results: U[] = [],
            index = this.binarySearch(this.items, { priority: priority }, this.compareTasks) + 1;

        if (!this.started) {
            this.started = true;
        }

        this.items.splice(index, 0, ...datas.map(capture, this));

        if (this.onsaturated && this.items.length >= this.limit) {
            this.onsaturated();
        }

        return promise;

        function capture(this: PriorityQueue<T, U>, data: T): QueueItem<T, U> {
            const item = this.createItem(data, results, errors, length, resolver, rejecter);
            item.priority = priority;

            nextTick(this.process);

            return item;
        }
    }

    private binarySearch(seq: Array<QueueItem<T, U>>, item: { priority?: number }, compare: (a: { priority?: number }, b: { priority?: number }) => number): number {
        let beg = -1;
        let end = seq.length - 1;

        let mid: number;
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
    private compareTasks(a: { priority?: number }, b: { priority?: number }): number {
        return (a.priority || 0) - (b.priority || 0);
    }
}

export class TaskQueue<T> extends Queue<PromiseTaskExecutor<T>, T> {

    constructor(limit?: number, list?: Array<PromiseTaskExecutor<T>>) {
        super(item => item(), limit, list);
    }

}

export class PriorityTaskQueue<T> extends PriorityQueue<PromiseTaskExecutor<T>, T> {

    constructor(limit?: number, list?: Array<PromiseTaskExecutor<T>>) {
        super(item => item(), limit, list);
    }

}


export function queue<T, U>(worker: QueueWorker<T, U>, limit?: number, list?: T[]): Queue<T, U> {
    return new Queue(worker, limit, list);
}

export function priorityQueue<T, U>(worker: QueueWorker<T, U>, limit?: number, list?: T[]): PriorityQueue<T, U> {
    return new PriorityQueue(worker, limit, list);
}

export function taskQueue<T>(limit?: number, list?: Array<PromiseTaskExecutor<T>>): TaskQueue<T> {
    return new TaskQueue(limit, list);
}

export function priorityTaskQueue<T>(limit?: number, list?: Array<PromiseTaskExecutor<T>>): PriorityTaskQueue<T> {
    return new PriorityTaskQueue(limit, list);
}


export function eachLimit<T>(array: T[], limit: number, iterator: PromiseListIterator<T, any>): Promise<void> {
    const iterators = array.map<PromiseTaskExecutor<any>>((value, index, list) => () => iterator(value, index, list));
    return taskQueue(limit).push(iterators).then(() => void 0);
}

export function mapLimit<T, U>(array: T[], limit: number, iterator: PromiseListIterator<T, U>): Promise<U[]> {
    const iterators = array.map<PromiseTaskExecutor<U>>((value, index, list) => () => iterator(value, index, list));
    return taskQueue<U>(limit).push(iterators);
}

export function parallelLimit<T>(tasks: Array<PromiseTaskExecutor<T>>, limit: number): Promise<T[]>;
export function parallelLimit<T>(tasks: PromiseTaskExecutorObject<T>, limit: number): Promise<PromizrObjectResult<T>>;
export function parallelLimit<T>(tasks: Array<PromiseTaskExecutor<T>> | PromiseTaskExecutorObject<T>, limit: number): Promise<T[] | PromizrObjectResult<T>> {
    if (Array.isArray(tasks)) {
        return taskQueue<T>(limit).push(<Array<PromiseTaskExecutor<T>>>tasks);
    }

    const obj = <PromiseTaskExecutorObject<T>>tasks;
    const data = Object.keys(obj);
    const result: any = {};

    return queue(worker, limit).push(data).then(() => result);

    function worker(key: string): Promise<void> {
        return obj[key]().then(res => {
            result[key] = res;
        });
    }
}
