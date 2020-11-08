import type { AsyncListIterator } from "./_types";

import exec from "./exec";

/**
 * Applies the function `iterator` to each item in `arr`, in parallel.
 * The `iterator` is called with an item from the list, the index of this item and the list itself.
 * If the `iterator` emit a rejected Promise, the each function `Promise` result is instantly rejected.
 * 
 * Note: since this function applies `iterator` to each item in parallel, there is no guarantee that the iterator functions will complete in order.
 * 
 * @param array - The array to iterate on
 * @param iterator - The iterator to apply on each item
 */
export default function each<T>(array: T[], iterator: AsyncListIterator<T, unknown>): Promise<void> {
    const promises = array.map(executor);
    return Promise.all(promises).then(() => void 0);

    function executor(item: T, index: number, list: T[]): Promise<unknown> {
        return exec(iterator, item, index, list);
    }
}
