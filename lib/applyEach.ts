import type { Async, AsyncFunction } from "./_types";

import parallel from "./parallel";

/**
 * Prepare a new function which call all `tasks` in parallel with given arguments.
 * Returns an array with the result of all `tasks`.
 */
export default function applyEach<T extends AsyncFunction[]>(tasks: T): (...args: Parameters<T[number]>) => Async<Array<ReturnType<T[number]>>> {
    return function (this: unknown, ...args: unknown[]): Async<Array<ReturnType<T[number]>>> {
        const iterators = tasks.map(e => () => e.apply(this, args));
        return parallel(iterators);
    };
}
