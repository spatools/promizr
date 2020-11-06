import type { Async, AsyncFunction } from "./_types";
import type { GetFirst, GetLastReturnType } from "./_internal";

import resolve from "./resolve";

/**
 * Prepare a new function that transfer its arguments to the fist `task` then calls each `task` using the result of the previous `task`.
 * Resolves with the result of the last `task`.
 * Note: Execution order if from start to end.
 */
export default function seq<T extends AsyncFunction[]>(...tasks: T): (...args: Parameters<GetFirst<T>>) => Async<GetLastReturnType<T>> {
    return function (this: unknown, ...args: unknown[]): Async<GetLastReturnType<T>> {
        let p: Promise<any> = resolve();

        const len = tasks.length;
        if (!len) return p;

        const first = tasks[0];
        p = p.then(() => first.apply(this, args));

        for (let i = 1; i < len; i++) {
            p = p.then(tasks[i]);
        }

        return p;
    };
}
