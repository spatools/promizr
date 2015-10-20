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
    protected items: QueueItem<T, U>[] = [];
    protected workers = 0;

    protected started = false;
    protected paused = false;
    protected hasException = false;

    public onempty: Function;
    public ondrain: Function;
    public onsaturated: Function;

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
        if (!this.paused || !this.hasException) {
            return;
        }

        this.paused = false;
        this.hasException = false;

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

    private insert(datas: T[], before?: boolean): Promise<U | U[]> {
        let resolver: PromiseResolveFunction<U | U[]>,
            rejecter: PromiseRejectFunction;

        const
            promise = new Promise((res, rej) => { resolver = res; rejecter = rej; }),
            length = datas.length,
            errors: any[] = [],
            results: U[] = [];

        if (length === 0) {
            return Promise.resolve([]);
        }

        if (!this.started) {
            this.started = true;
        }

        function capture(data: T): QueueItem<T, U> {
            nextTick(this.process);
            return this.createItem(data, results, errors, length, resolver, rejecter);
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

    protected createItem(data: T, results: U[], errors: any[], count: number, resolve: PromiseResolveFunction<U | U[]>, reject: PromiseRejectFunction): QueueItem<T, U> {
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
                    var error: QueueError = new Error("Queue worker exception");

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
            var item = this.items.shift();

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
        const length = datas.length;
        if (length === 0) {
            return Promise.resolve([]);
        }

        let resolver: PromiseResolveFunction<U | U[]>,
            rejecter: PromiseRejectFunction;

        const
            promise = new Promise((res, rej) => { resolver = res; rejecter = rej; }),
            errors: any[] = [],
            results: U[] = [],
            index = this.binarySearch(this.items, { priority: priority }, this.compareTasks) + 1;

        if (!this.started) {
            this.started = true;
        }

        function capture(data: T): QueueItem<T, U> {
            const item = this.createItem(data, results, errors, length, resolver, rejecter);
            item.priority = priority;

            nextTick(this.process);

            return item;
        }


        this.items.splice.apply(this.items, [index, 0].concat<any>(datas.map(capture, this)));

        if (this.onsaturated && this.items.length >= this.limit) {
            this.onsaturated();
        }

        return promise;
    }

    private binarySearch(seq: QueueItem<T, U>[], item: QueueItemOptions<T, U>, compare: (a: QueueItemOptions<T, U>, b: QueueItemOptions<T, U>) => number): number {
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
    private compareTasks(a: QueueItemOptions<T, U>, b: QueueItemOptions<T, U>): number {
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
