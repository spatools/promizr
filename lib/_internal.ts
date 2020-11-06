//#region Tuples

export type GetLength<Tuple extends readonly any[]> = Tuple extends { length: infer L } ? L : -1;
export type GetLast<Tuple extends readonly any[]> = Tuple[PreviousIndex<GetLength<Tuple>>];
export type GetLast2<Tuple extends readonly any[]> = Tuple[PreviousIndex<PreviousIndex<GetLength<Tuple>>>];
export type GetFirst<Tuple extends readonly any[]> = Tuple[0];

export type Prepend<Tuple extends readonly any[], Item> = [first: Item, ...rest: Tuple];
export type Append<Tuple extends readonly any[], Item> = [...tuple: Tuple, last: Item];
export type Concat<Tuple1 extends readonly any[], Tuple2 extends readonly any[]> = [...tuple: Tuple1, ...append: Tuple2];

export type RemoveFirst<Tuple extends readonly any[]> = Tuple extends [first: any, ...result: infer Result] ? Result : Tuple;
export type RemoveLast<Tuple extends readonly any[]> = Tuple extends [...result: infer Result, last: any] ? Result : Tuple;
export type RemoveFromStart<Tuple extends readonly any[], ToRemove extends readonly any[]> = Tuple extends [...start: ToRemove, ...result: infer Result] ? Result : Tuple;
export type RemoveFromEnd<Tuple extends readonly any[], ToRemove extends readonly any[]> = Tuple extends [...result: infer Result, ...end: ToRemove] ? Result : Tuple;

export type PreviousIndex<T extends number> = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62][T];

//#endregion

//#region Functions

/** Utility type to extract keys from object where value is a function. */
export type MethodNames<T> = {
    [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? K : never;
}[keyof T];

export type Func = (...args: any[]) => any;

export type PartialParameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? Partial<P> : never;
export type RestOfParameters<Method extends (...args: any[]) => any, UsedParameters extends any[]> = RemoveFromStart<Parameters<Method>, UsedParameters>;
export type ParametersWithoutLast<Method extends Func> = RemoveFromEnd<Parameters<Method>, [GetLast<Parameters<Method>>]>;
export type ParametersWithoutLast2<Method extends Func> = RemoveFromEnd<Parameters<Method>, [GetLast2<Parameters<Method>>, GetLast<Parameters<Method>>]>;

export type GetFirstReturnType<T extends Func[]> = T extends [] ? void : ReturnType<GetFirst<T>>;
export type GetLastReturnType<T extends Func[]> = T extends [] ? void : ReturnType<GetLast<T>>;

//#endregion

//#region Node-style callback functions

type NodeStyleCallback<T = any> = (err: any, ...rest: T[]) => any;
type NodeStyleCallbackResultType<T extends NodeStyleCallback> =
    T extends (err: any) => any ? void :
    T extends (err: any, rest: infer Result) => any ? Result :
    T extends (err: any, ...rest: infer Results) => any ? Results :
    void;

export type FunctionWithNodeStyleCallback = (...args: [...any, NodeStyleCallback]) => any;
export type FunctionWithNodeStyleCallbackReturnType<T extends FunctionWithNodeStyleCallback> = NodeStyleCallbackResultType<GetLast<Parameters<T>>>;

//#endregion

//#region Multi-callbacks functions

type ErrorCalback = (err: Error) => any;
type SimpleCallback<T = any> = (...args: T[]) => any;
type SimpleCallbackResultType<T extends SimpleCallback> =
    T extends () => any ? void :
    T extends (arg: infer Result) => any ? Result :
    T extends (...args: infer Results) => any ? Results :
    void;

export type FunctionWithMultiCallbacks = (...args: [...any, SimpleCallback, ErrorCalback]) => any;
export type FunctionWithMultiCallbacksReturnType<T extends FunctionWithMultiCallbacks> = SimpleCallbackResultType<GetLast2<Parameters<T>>>;

//#endregion

//#region Queue

export type QueueItemOptions<T> = {
    data: T;
    priority?: number;
};

export type QueueItem<T, U> = QueueItemOptions<T> & {
    resolver(result: U): void;
    rejecter(err: Error): void;
}

export type QueueWorker<T, U> = (arg: T) => U | Promise<U>;

//#endregion
