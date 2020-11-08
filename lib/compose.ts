import type { Async, AsyncFunction } from "./_types";
import type { GetLast, GetFirstReturnType } from "./_internal";

import resolve from "./resolve";

/**
 * @public
 * 
 * Prepare a new function that transfer its arguments to the last `task` then calls each `task` using the result of the previous `task`.
 * Resolves with the result of the first `task`.
 * 
 * Note: Execution order if from end to start.
 * 
 * @param tasks - Functions to be run from last to first
 */
export default function compose<T extends AsyncFunction[]>(...tasks: T): (...args: Parameters<GetLast<T>>) => Async<GetFirstReturnType<T>> {
    return function (this: unknown, ...args: unknown[]): Async<GetFirstReturnType<T>> {
        let p: Promise<any> = resolve();

        const len = tasks.length;
        if (!len) return p;

        const last = tasks[len - 1];
        p = p.then(() => last.apply(this, args));

        for (let i = len - 2; i >= 0; i--) {
            p = p.then(tasks[i]);
        }

        return p;
    };
}
