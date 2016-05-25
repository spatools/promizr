/// <reference path="../tests.d.ts" />

import * as promizr from "promizr";

class ProgressContext {
    public deferreds: promizr.ProgressPromiseDeferred<number, number>[];

    public constructor(public count: number) {
        this.reset();
    }

    public promises(): promizr.ProgressPromiseable<number, number>[] {
        return this.deferreds.map(d => d.promise);
    }

    public addFake() {
        const dfd = promizr.defer();
        this.deferreds.push({
            resolve: dfd.resolve,
            reject: dfd.reject,
            progress: undefined,
            promise: <any>dfd.promise
        });

        return this;
    }

    public resolve();
    public resolve(index: number);
    public resolve(index: number, value: number);
    public resolve(index?: number, value?: number) {
        if (arguments.length === 0) {
            console.log("al");
            this.deferreds.forEach(d => d.resolve());
            return;
        }

        const defer = this.deferreds[index];
        if (defer) {
            defer.resolve(value);
        }
    }

    public reject();
    public reject(index: number);
    public reject(index: number, value: number);
    public reject(index?: number, reason?: Error|any) {
        if (arguments.length === 0) {
            this.deferreds.forEach(d => d.reject(reason));
            return;
        }

        const defer = this.deferreds[index];
        if (defer) {
            defer.reject(reason);
        }
    }

    public progress(index: number);
    public progress(index: number, value: number);
    public progress(index: number, value?: number) {
        if (arguments.length === 1) {
            this.deferreds.forEach(d => d.progress && d.progress(index));
            return;
        }

        const defer = this.deferreds[index];
        if (defer && defer.progress) {
            defer.progress(value);
        }
    }

    public all(): promizr.ProgressPromise<number[], number[]> {
        return promizr.ProgressPromise.all(this.promises());
    }

    public race(): promizr.ProgressPromise<number, number[]> {
        return promizr.ProgressPromise.race(this.promises());
    }

    public reset() {
        this.deferreds = new Array(this.count);

        for (let i = 0; i < this.count; i++) {
            this.deferreds[i] = promizr.ProgressPromise.defer<number, number>();
        }
    }
}

export = ProgressContext;
