
interface PromiseExecutor<T> {
    (resolve: PromiseResolveFunction<T>, reject: PromiseRejectFunction): void;
}

interface PromiseRejectFunction {
    (reason: Error): void;
    (reason: any): void;
}
interface PromiseResolveFunction<T> {
    (): void;
    (value: T): void;
}

interface PromiseErrorCallback<U> {
    (reason: Error): U|Thenable<U>;
    (reason: any): U|Thenable<U>;
}

interface PromiseCapability<T> {
    promise: Promise<T>;
    resolve: PromiseResolveFunction<T>;
    reject: PromiseRejectFunction;
}

interface PromiseReaction {
    capability: PromiseCapability<any>;
    handler: Function;
}

interface PromiseTask {
    executor: Function;
    args: any[];
}

declare type Resolveable<T> = T | Thenable<T>;

interface Thenable<T> {
    then<U>(onFulfilled: (value: T) => Resolveable<U>): Thenable<U>;
    then<U>(onFulfilled: (value: T) => Resolveable<U>, onRejected: PromiseErrorCallback<U>): Thenable<U>;
}

declare class Promise<T> implements Thenable<T> {
    _status: string;
    _result: any;
    _rejectReactions: PromiseReaction[];
    _resolveReactions: PromiseReaction[];

    constructor(executor: PromiseExecutor<T>);

    then<U>(onFulfilled: (value: T) => Resolveable<U>): Promise<U>;
    then<U>(onFulfilled: (value: T) => Resolveable<U>, onRejected: PromiseErrorCallback<U>): Promise<U>;

    catch<U>(onRejected: PromiseErrorCallback<U>): Promise<U>;

    static all<T>(promises: Resolveable<T>[]): Promise<T[]>;
    static race<T>(promises: Resolveable<T>[]): Promise<T>;

    static cast<T>(value: any): Promise<T>;

    static resolve<T>(): Promise<T>;
    static resolve<T>(value: Resolveable<T>): Promise<T>;

    static reject(reason: Error): Promise<any>;
    static reject(reason: any): Promise<any>;
}

declare module "promise" {
    export = Promise;
}
