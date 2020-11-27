import type { Deferred, QueueOptions } from "./_types";

import QueueError from "./QueueError";

import { setImmediate } from "./setImmediate";
import defer from "./defer";
import exec from "./exec";

type QueueItem<T, U> = {
    data: T;
    priority?: number;

    resolver(result: U): void;
    rejecter(err: Error): void;
}

/**
 * @public
 * 
 * A Queue runs a `worker` function on each item that it contains but limit the number of concurrent runs.
 */
export default class Queue<T, U> {
    protected items: Array<QueueItem<T, U>> = [];
    protected worker: (arg: T) => U | Promise<U>;
    protected workers = 0;

    protected started = false;
    protected paused = false;
    protected hasException = false;

    public limit: number;

    public onempty: (() => any) | undefined;
    public ondrain: (() => any) | undefined;
    public onsaturated: (() => any) | undefined;

    public stopOnError = false;
    public waitToReject = false;

    public get length(): number {
        return this.items.length + this.workers;
    }

    public get running(): boolean {
        return this.workers > 0;
    }

    public get idle(): boolean {
        return this.items.length + this.workers === 0;
    }

    /**
     * Creates a new Queue.
     * 
     * @param worker - The worker function to apply on each item in Queue
     * @param limit - The maximum number of concurrent workers to launch
     * @param options - The options for the Queue
     */
    constructor(worker: (arg: T) => U | Promise<U>, limit = 1, options?: QueueOptions) {
        this.worker = worker;
        this.limit = limit;

        if (options) {
            const keys = Object.keys(options) as Array<keyof QueueOptions>;
            for (const key of keys) {
                if (options[key]) this[key] = options[key] as any;
            }
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

    public pause(): void {
        this.paused = true;
    }

    public resume(): void {
        if (!this.paused) {
            return;
        }

        this.paused = false;
        this.hasException = false;

        for (let i = this.limit; i > 0; i--) {
            this.process();
        }
    }

    public clear(): void {
        this.ondrain = undefined;
        this.items = [];
    }

    private insert(datas: T[], before?: boolean): Promise<U | U[]> {
        const length = datas.length;
        if (length === 0) {
            return Promise.resolve([]);
        }

        const dfd = defer<U | U[]>();
        if (!this.started) {
            this.started = true;
        }

        const iterator = createIterator(length, dfd);
        if (before) this.items.unshift(...datas.map(iterator, this));
        else this.items.push(...datas.map(iterator, this));

        if (this.onsaturated && this.items.length >= this.limit) {
            this.onsaturated();
        }

        for (let i = this.limit; i > 0; i--) {
            this.process();
        }

        return dfd.promise;

        function createIterator(count: number, dfd: Deferred<U | U[]>): (data: T) => QueueItem<T, U> {
            const errors: any[] = [];
            const results: U[] = [];

            return function (this: Queue<T, U>, data: T) {
                return this.createItem(data, results, errors, count, dfd.resolve, dfd.reject);
            };
        }
    }

    protected createItem(data: T, results: U[], errors: any[], count: number, resolve: (result: U | U[] | PromiseLike<U | U[]>) => void, reject: (err?: any) => void): QueueItem<T, U> {
        return {
            data: data,
            resolver: res => {
                results.push(res);

                const resultsLen = results.length;
                if (resultsLen === count) {
                    resolve(resultsLen === 1 ? results[0] : results);
                }

                if (errors.length + resultsLen === count) {
                    reject(new QueueError(errors, results));
                }
            },
            rejecter: err => {
                if (!this.waitToReject || this.stopOnError) {
                    return reject(err);
                }

                errors.push(err);

                if (errors.length + results.length === count) {
                    reject(new QueueError(errors, results));
                }
            }
        };
    }

    protected process(): void {
        if (this.paused || this.workers >= this.limit || !this.items.length || (this.stopOnError && this.hasException)) {
            return;
        }

        const item = this.items.shift();
        if (!item) {
            return;
        }

        if (this.onempty && this.items.length === 0) {
            this.onempty();
        }

        this.workers += 1;
        setImmediate(this.createItemProcess(item));
    }

    private createItemProcess(item: QueueItem<T, U>): () => void {
        return () => {
            exec(this.worker, item.data).then(
                res => {
                    item.resolver.call(undefined, res as U);
                    this.onProcessEnd();
                },
                err => {
                    item.rejecter.call(undefined, err);
                    this.hasException = true;
                    this.onProcessEnd();
                }
            );
        };
    }

    protected onProcessEnd(): void {
        this.workers -= 1;

        if (this.ondrain && this.items.length + this.workers === 0) {
            this.ondrain();
        }

        this.process();
    }
}
