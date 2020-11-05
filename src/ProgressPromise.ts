export type ProgressPromiseCallback<P> = (val: P) => void;
export type ProgressPromiseExecutor<T, P> = (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void, progress: ProgressPromiseCallback<P>) => void;

export interface ProgressPromiseDeferred<T, P> {
    resolve(val?: T | PromiseLike<T>): void;
    reject(err?: any): void;
    progress(val: P): void;

    promise: ProgressPromise<T, P>;
}

export function isProgressPromise<T, P>(p: T | PromiseLike<T>): p is ProgressPromise<T, P> {
    return "progress" in p && "then" in p;
}

export class ProgressPromise<T, P> implements PromiseLike<T> {
    private _innerPromise: Promise<T>;
    protected _progress: P | undefined = undefined;
    protected _progressesCallbacks: Array<ProgressPromiseCallback<P>> = [];

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

    public progress(onProgress: ProgressPromiseCallback<P>): ProgressPromise<T, P> {
        if (this._progressesCallbacks) {
            this._progressesCallbacks.push(onProgress);
        }

        if (typeof this._progress !== "undefined") {
            onProgress.call(undefined, this._progress);
        }

        return this;
    }

    /**
     * Create a new Promise by chaining given callback to current Promise
     * @param onfulfilled Callback to be called when Promise fulfills
     * @param onrejected Callback to be called when Promise fails
     * @returns Chained Promise
     */
    public then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2> {
        return this._innerPromise.then(onfulfilled, onrejected);
    }

    /**
     * The catch function allows to apply a callback on rejection handler.
     * It is equivalent to promise.then(undefined, onRejected)
     * @param onrejected callback to be called whenever promise fail
     * @returns A chained Promise which handle error and fullfil
     */
    public catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult> {
        return this._innerPromise.catch(onrejected);
    }

    public static defer<T, P>(): ProgressPromiseDeferred<T, P> {
        const def: any = {};
        def.promise = new ProgressPromise((res, rej, pro) => {
            def.resolve = res;
            def.reject = rej;
            def.progress = pro;
        });

        return def;
    }

    public static all<T, P>(promises: Array<T | PromiseLike<T>>): ProgressPromise<T[], Array<P | undefined>> {
        return new ProgressPromise<T[], Array<P | undefined>>((resolve, reject, progress) => {
            initAllProgresses(promises, progress);
            Promise.all(promises).then(resolve, reject);
        });
    }
    public static race<T, P>(promises: Array<PromiseLike<T>>): ProgressPromise<T, Array<P | undefined>> {
        return new ProgressPromise<T, Array<P | undefined>>((resolve, reject, progress) => {
            initAllProgresses(promises, progress);
            Promise.race(promises).then(resolve, reject);
        });
    }

    private cleaner(): void {
        this._progressesCallbacks = [];
    }

    private createProgressFunction(): ProgressPromiseCallback<P> {
        return (val: P) => {
            const
                cbs = this._progressesCallbacks,
                len = cbs.length;

            for (let i = 0; i < len; i++) {
                cbs[i].call(undefined, val);
            }

            this._progress = val;
        };
    }
}

function initAllProgresses<T, P>(promises: Array<T | PromiseLike<T>>, progress: ProgressPromiseCallback<Array<P | undefined>>): void {
    const len = promises.length;
    const progresses = new Array<P | undefined>(len);

    for (let i = 0; i < len; i++) {
        const p = promises[i];
        progresses[i] = undefined;

        if (isProgressPromise<T, P>(p)) {
            p.progress(createAllProgressCallback(progress, progresses, i));
        }
    }
}

function createAllProgressCallback<P>(progress: ProgressPromiseCallback<Array<P | undefined>>, progresses: Array<P | undefined>, index: number): (val: P) => void {
    return (val: P) => {
        progresses[index] = val;
        progress(progresses);
    };
}
