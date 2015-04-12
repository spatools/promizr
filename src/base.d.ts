/// <reference path="../polyfill/promise.d.ts" />

interface TypedFunction<T> {
    (...args: any[]): T;
}

interface PromiseTaskExecutor<T> {
    (): Promise<T>
    (...args: any[]): Promise<T>
}

interface PromiseTaskExecutorObject<T> {
    [key: string]: () => Promise<T>
}

interface PromiseSeriesObjectResult<T> {
    [key: string]: T
}

interface PromiseListIterator<T, U> {
    (item: T, index: number, list: T[]): Promise<U>;
}

interface PromiseReduceIterator<T> {
    (memo: T, item: T): Promise<T>;
}

interface QueueTaskItem<T> {
    priority?: number;
    task?: PromiseTaskExecutor<T>
}

