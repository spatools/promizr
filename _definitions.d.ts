/// <reference path="polyfill/promise.d.ts" />

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

declare var Uint8ClampedArray: any;

interface PromiseTaskExecutor<T> {
    (): Promise<T>
    (...args: any[]): Promise<T>
}

interface PromiseListIterator<T, U> {
    (item: T, index: number, list: T[]): Promise<U>;
}

declare var nextTick: (cb: Function) => void;
