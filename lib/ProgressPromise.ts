import resolve from "./resolve";
import { Awaited } from "./_types";

type AwaitedTuple<T extends readonly unknown[]> = { [K in keyof T]: Awaited<T[K]> };

type ProgressItems<T extends readonly unknown[]> = { [K in keyof T]: T[K] extends ProgressPromise<unknown, infer R> ? R : undefined };

type ProgressPromiseExecutor<T, P> = (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void, progress: (progress: P) => void) => void;

export interface ProgressPromiseDeferred<T, P> {
    resolve(val?: T | PromiseLike<T>): void;
    reject(err?: any): void;
    progress(val: P): void;

    promise: ProgressPromise<T, P>;
}

/**
 * A ProgressPromise is a special Promise which allows to track progress of the inner process.
 */
export default class ProgressPromise<T, P> implements PromiseLike<T> {
    protected _innerPromise: Promise<T>;
    protected _progress: P | undefined = undefined;
    protected _progressesCallbacks: Array<(progress: P) => void> | undefined = [];

    constructor(executor: ProgressPromiseExecutor<T, P>) {
        if (!(this instanceof ProgressPromise)) {
            throw new TypeError("Failed to construct 'ProgressPromise': Please use the 'new' operator, this object constructor cannot be called as a function.");
        }

        this._innerPromise = new Promise((resolve, reject) => {
            executor(resolve, reject, this.createProgressFunction());
        });

        const clean = this.cleaner.bind(this);
        this._innerPromise.then(clean, clean);
    }

    /**
     * Adds a progress callback who listen to progress evolution of the `ProgressPromise`.
     * 
     * @param onprogress - The callback to execute when the ProgressPromise progress changed.
     * @return - This Promise
     */
    public progress(onprogress?: (progress: P) => void): this {
        if (typeof onprogress !== "function") return this;

        this._progressesCallbacks?.push(onprogress);

        if (typeof this._progress !== "undefined") {
            onprogress(this._progress);
        }

        return this;
    }

    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * 
     * @param onfulfilled - The callback to execute when the Promise is resolved.
     * @param onrejected - The callback to execute when the Promise is rejected.
     * 
     * @returns - A Promise for the completion of which ever callback is executed.
     */
    public then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2> {
        return this._innerPromise.then(onfulfilled, onrejected);
    }

    /**
     * Attaches a callback for only the rejection of the Promise.
     * 
     * @param onrejected - The callback to execute when the Promise is rejected.
     * 
     * @returns - A Promise for the completion of the callback.
     */
    public catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult> {
        return this._innerPromise.catch(onrejected);
    }

    /**
     * Attaches a callback that is invoked when the `Promise` is settled (fulfilled or rejected).
     * The resolved value cannot be modified from the callback.
     * 
     * @param onfinally - The callback to execute when the `Promise` is settled (`fulfilled` or `rejected`).
     * @returns - A Promise for the completion of the callback.
     */
    public finally(onfinally?: (() => void) | undefined | null): Promise<T> {
        if (typeof onfinally !== "function") {
            return this._innerPromise.then();
        }

        return this._innerPromise.then(
            (value) => resolve(onfinally()).then(() => value),
            (reason) => resolve(onfinally()).then(() => { throw reason; })
        );
    }

    /**
     * Returns a new ProgressPromiseDeferred object.
     */
    public static defer<T, P>(): ProgressPromiseDeferred<T, P> {
        const def: any = {};
        def.promise = new ProgressPromise((res, rej, pro) => {
            def.resolve = res;
            def.reject = rej;
            def.progress = pro;
        });

        return def;
    }

    /**
     * Creates a `ProgressPromise` that is resolved with an array of results when all of the provided Promises resolve, or rejected when any Promise is rejected.
     * 
     * The `progress` function returns an array of all progresses from found ProgressPromises in `values`.
     * 
     * @param values - An array of Promises.
     * @returns - A new Promise.
     */
    public static all<Args extends readonly unknown[]>(values: [...Args]): ProgressPromise<AwaitedTuple<Args>, ProgressItems<Args>> {
        return new ProgressPromise<AwaitedTuple<Args>, ProgressItems<Args>>((resolve, reject, progress) => {
            initAllProgresses(values, progress);
            Promise.all(values).then(resolve as (arg: unknown) => void, reject);
        });
    }

    /**
     * Creates a Promise that is resolved or rejected when any of the provided Promises are resolved or rejected.
     * The `progress` function returns an array of all progresses from found ProgressPromises in `values`.
     * 
     * @param values - An array of Promises.
     * @returns - A new Promise.
     */
    public static race<Args extends readonly unknown[]>(promises: Args): ProgressPromise<Awaited<Args[number]>, ProgressItems<Args>> {
        return new ProgressPromise<Awaited<Args[number]>, ProgressItems<Args>>((resolve, reject, progress) => {
            initAllProgresses(promises, progress);
            Promise.race(promises).then(resolve as (arg: unknown) => void, reject);
        });
    }

    private cleaner(): void {
        this._progressesCallbacks = undefined;
    }

    private createProgressFunction(): (val: P) => void {
        return (val: P) => {
            const callbacks = this._progressesCallbacks;
            if (!callbacks) return;

            const len = callbacks.length;
            for (let i = 0; i < len; i++) {
                callbacks[i](val);
            }

            this._progress = val;
        };
    }
}

function initAllProgresses<T extends readonly unknown[], P = ProgressItems<T>>(promises: T, progress: (progress: P) => void): void {
    const len = promises.length;
    const progresses = new Array<P | undefined>(len);

    for (let i = 0; i < len; i++) {
        const p = promises[i];
        progresses[i] = undefined;

        if (isProgressPromise<any, any>(p)) {
            p.progress(createAllProgressCallback(progress as any, progresses, i));
        }
    }
}

function createAllProgressCallback<P>(progress: (progress: Array<P | undefined>) => void, progresses: Array<P | undefined>, index: number): (val: P) => void {
    return (val: P) => {
        progresses[index] = val;
        progress(progresses);
    };
}

function isProgressPromise<T, P>(p: any): p is ProgressPromise<T, P> {
    return "progress" in p && "then" in p;
}
