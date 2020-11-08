import type { Deferred, PriorityQueueOptions } from "./_types";

import Queue from "./Queue";
import defer from "./defer";

type PriorityQueueItem<T, P> = Queue<T, P>["items"][number] & { priority?: number; };

export default class PriorityQueue<T, U> extends Queue<T, U> {
    public defaultPriority = 1;

    protected items: Array<PriorityQueueItem<T, U>> = [];

    /**
     * Creates a new PriorityQueue.
     * 
     * @param worker The worker function to apply on each item in PriorityQueue
     * @param limit The maximum number of concurrent workers to launch
     * @param options The options for the PriorityQueue
     */
    constructor(worker: (arg: T) => U | Promise<U>, limit?: number, options?: PriorityQueueOptions) {
        super(worker, limit, options);
    }

    public push(priority: number, data?: T): Promise<U>;
    public push(priority: number, datas: T[]): Promise<U[]>;
    public push(priority: number, ...datas: T[]): Promise<U[]>;
    public push(data: T): Promise<U>;
    public push(datas: T[]): Promise<U[]>;
    public push(...datas: T[]): Promise<U[]>;
    public push(...datas: any[]): Promise<U | U[]> {
        let priority = this.defaultPriority;
        if (typeof datas[0] === "number" && datas.length > 1) {
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

        const index = this.binarySearch(this.items, { priority }, this.compareTasks) + 1;

        const dfd = defer<U | U[]>();
        if (!this.started) {
            this.started = true;
        }

        const iterator = createIterator(length, dfd, priority);
        this.items.splice(index, 0, ...datas.map(iterator, this));

        if (this.onsaturated && this.items.length >= this.limit) {
            this.onsaturated();
        }

        for (let i = this.limit; i > 0; i--) {
            this.process();
        }

        return dfd.promise;


        function createIterator(count: number, dfd: Deferred<U | U[]>, priority: number): (data: T) => PriorityQueueItem<T, U> {
            const errors: any[] = [];
            const results: U[] = [];

            return function (this: PriorityQueue<T, U>, data: T): PriorityQueueItem<T, U> {
                const item = this.createItem(data, results, errors, count, dfd.resolve, dfd.reject);
                item.priority = priority;
                return item;
            };
        }
    }

    private binarySearch(seq: Array<PriorityQueueItem<T, U>>, item: { priority?: number }, compare: (a: { priority?: number }, b: { priority?: number }) => number): number {
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
