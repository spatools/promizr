import type { Async, AsyncFunction } from "./_types";

import parallel from "./parallel";

/**
 * Prepare a new function which call all `tasks` in parallel with given arguments.
 * Returns an array with the result of all `tasks`.
 * 
 * @param tasks - Functions to run
 * 
 * @example
 * ```typescript
 * const upper = (value: string) => value.toUpperCase();
 * const lower = (value: string) => value.toLowerCase();
 * const prefix = (value: string) => `prefix-${value}`;
 * 
 * const task = promizr.applyEach(action);
 * 
 * const res = await task("Value");
 * // res === ["VALUE", "value", "prefix-Value"]
 * ```
 */
export default function applyEach<T extends AsyncFunction[]>(tasks: T): (...args: Parameters<T[number]>) => Async<Array<ReturnType<T[number]>>> {
    return function (this: unknown, ...args: unknown[]): Async<Array<ReturnType<T[number]>>> {
        const iterators = tasks.map(e => () => e.apply(this, args));
        return parallel(iterators);
    };
}
