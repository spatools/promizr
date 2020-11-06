import ProgressPromise, { ProgressPromiseDeferred } from "../../lib/ProgressPromise";

export type ProgressPromiseable<T, P> = T | PromiseLike<T> | ProgressPromise<T, P>;
export type ProgressContextDeferred<T, P> = Omit<ProgressPromiseDeferred<T, P>, "progress"> & { progress?: (val: P) => void | undefined };

import defer from "../../lib/defer";

export default class ProgressContext {
    private deferreds: ProgressContextDeferred<number, number>[] = [];

    public constructor(public count: number) {
        this.reset();
    }

    public promises(): Array<PromiseLike<number> | ProgressPromise<number, number>> {
        return this.deferreds.map(d => d.promise);
    }

    public addFake(): this {
        const dfd = defer();
        this.deferreds.push({
            resolve: dfd.resolve,
            reject: dfd.reject,
            progress: undefined,
            promise: <any>dfd.promise
        });

        return this;
    }

    public resolve(): void;
    public resolve(index: number): void;
    public resolve(index: number, value: number): void;
    public resolve(index?: number, value?: number): void {
        if (typeof index === "undefined") {
            this.deferreds.forEach(d => d.resolve());
            return;
        }

        const defer = this.deferreds[index];
        if (defer) {
            defer.resolve(value);
        }
    }

    public reject(): void;
    public reject(index: number): void;
    public reject(index: number, value: number): void;
    public reject(index?: number, reason?: Error | any): void {
        if (typeof index === "undefined") {
            this.deferreds.forEach(d => d.reject(reason));
            return;
        }

        const defer = this.deferreds[index];
        if (defer) {
            defer.reject(reason);
        }
    }

    public progress(index: number): void;
    public progress(index: number, value: number): void;
    public progress(index: number, value?: number): void {
        if (typeof value === "undefined") {
            this.deferreds.forEach(d => d.progress && d.progress(index));
            return;
        }

        const defer = this.deferreds[index];
        if (defer && defer.progress) {
            defer.progress(value);
        }
    }

    public all(): ProgressPromise<number[], Array<number | undefined>> {
        return ProgressPromise.all(this.promises()) as ProgressPromise<number[], Array<number | undefined>>;
    }

    public race(): ProgressPromise<number, Array<number | undefined>> {
        return ProgressPromise.race(this.promises()) as ProgressPromise<number, Array<number | undefined>>;
    }

    public reset(): void {
        this.deferreds = new Array(this.count);

        for (let i = 0; i < this.count; i++) {
            this.deferreds[i] = ProgressPromise.defer<number, number>();
        }
    }
}
