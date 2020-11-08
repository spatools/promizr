import type { Async, AsyncFunction } from "./_types";

import series from "./series";

/**
 * The same as {@link applyEach}, only `tasks` are applied in series.
 * The next `task` is only called once the current one has completed.
 * This means the `task` functions will complete in order.
 * 
 * @param tasks - Functions to run
 * 
 * @example
 * ```typescript
 * const upper = (value: string) => value.toUpperCase();
 * const lower = (value: string) => value.toLowerCase();
 * const prefix = (value: string) => `prefix-${value}`;
 * 
 * const task = promizr.applyEachSeries(action);
 * 
 * const res = await task("Value");
 * // res === ["VALUE", "value", "prefix-Value"]
 * ```
 */
export default function applyEachSeries<T extends AsyncFunction[]>(tasks: T): (...args: Parameters<T[number]>) => Async<Array<ReturnType<T[number]>>> {
    return function (this: unknown, ...args: unknown[]): Async<Array<ReturnType<T[number]>>> {
        const iterators = tasks.map(e => () => e.apply(this, args));
        return series(iterators);
    };
}
