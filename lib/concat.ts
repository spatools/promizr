import type { AsyncListIterator } from "./_types";

import map from "./map";

/**
 * @public
 * 
 * Applies `iterator` to each item in `array`, concatenating the results.
 * Returns the concatenated list. 
 * 
 * The `iterator`s are called in parallel, and the results are concatenated as they return.
 * There is no guarantee that the results array will be returned in the original order of `array` passed to the `iterator` function.
 * 
 * @param array - The array to iterate on
 * @param iterator - An iterator which returns arrays
 */
export default function concat<T, U>(array: T[], iterator: AsyncListIterator<T, U[]>): Promise<U[]> {
    return map(array, iterator)
        .then(results => ([] as U[]).concat(...results.filter(a => !!a)));
}
