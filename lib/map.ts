import type { AsyncListIterator } from "./_types";

import exec from "./exec";

/**
 * Produces a new array of values by mapping each value in `array` through the `iterator` function.
 * The `iterator` is called with an item from the list, the index of this item and the list itself.
 * If the `iterator` emit a rejected Promise, the each function `Promise` result is instantly rejected.
 * 
 * Note, that since this function applies the `iterator` to each item in parallel, there is no guarantee that the `iterator` functions will complete in order.
 * However, the results array will be in the same order as the original `arr`.
 */
export default function map<T, U>(array: T[], iterator: AsyncListIterator<T, U>): Promise<U[]> {
    const promises = array.map(mapper);
    return Promise.all(promises);

    function mapper(item: T, index: number, list: T[]): Promise<U> {
        return exec(iterator, item, index, list) as Promise<U>;
    }
}
