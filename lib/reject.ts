import type { AsyncListIterator } from "./_types";

import exec from "./exec";

/**
 * The opposite of {@link filter}.
 * Removes values that pass an `async` truth test.
 * 
 * @param array - The array to iterate on
 * @param iterator - The iterator which test each item
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
