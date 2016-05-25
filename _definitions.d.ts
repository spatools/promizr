/// <reference path="typings/globals/es2015-promise/index.d.ts" />

declare var process: any;
declare var require: any;
declare var global: any;
declare var define: any;
declare var module: any;
declare var exports: any;
declare var root: any;

interface RequireDefine {
    amd: boolean;
}

interface PromiseTaskExecutor<T> {
    (...args: any[]): Promise<T>;
}

interface PromiseListIterator<T, U> {
    (item: T, index: number, list: T[]): Promise<U>;
}

interface PromiseTaskExecutorObject<T> {
    [key: string]: () => Promise<T>
}

interface PromiseSeriesObjectResult<T> {
    [key: string]: T
}

declare var nextTick: (cb: Function) => void;
