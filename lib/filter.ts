import type { AsyncListIterator } from "./_types";

import exec from "./exec";

/**
 * Returns a new array of all the values in `array` which pass an async truth test.
 * The Promise returned by each `iterator` call can only returns `boolean` value!
 * This operation is performed in parallel, the results array could be in a different order as the original.
 * If the order matters, you could use the `findSeries` function.
 * 
 * @param array - The array to iterate on
 * @param iterator - The iterator which test each item
 */
export default function filter<T>(array: T[], iterator: AsyncListIterator<T, boolean>): Promise<T[]> {
    const results: T[] = [];

    return Promise.all(array.map(filterr)).then(() => results);

    function filterr(value: T, index: number, list: T[]): Promise<void> {
        return exec(iterator, value, index, list).then(include => {
            if (include) results.push(value);
        });
    }
}
