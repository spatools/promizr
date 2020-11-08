import type { AsyncListIterator } from "./_types";

import exec from "./exec";

/**
 * The same as {@link find}, only the `iterator` is applied to each item in `array` in series.
 * This means the result is always the first in the original `array` (in terms of array order) that passes the truth test.
 * 
 * @param array - The array to iterate on
 * @param iterator - The iterator which test each item
 */
export default function findSeries<T>(array: T[], iterator: AsyncListIterator<T, boolean>): Promise<T | undefined> {
    const last = array.length - 1;

    return recurse();

    function recurse(index = 0): Promise<T | undefined> {
        const value = array[index];

        return exec(iterator, value, index, array)
            .then(valid => {
                if (valid) { return value; }

                if (index < last) {
                    return recurse(index + 1);
                }
            });
    }
}
