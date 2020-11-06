import type { AsyncListIterator } from "./_types";

import exec from "./exec";

/**
 * The opposite of `filter`.
 * Removes values that pass an `async` truth test.
 */
export default function reject<T>(array: T[], iterator: AsyncListIterator<T, boolean>): Promise<T[]> {
    const results: T[] = [];

    return Promise.all(array.map(rejecter)).then(() => results);

    function rejecter(item: T, index: number, list: T[]): Promise<void> {
        return exec(iterator, item, index, list).then(include => {
            if (!include) results.push(item);
        });
    }
}
