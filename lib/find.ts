import type { AsyncListIterator } from "./_types";

import exec from "./exec";

/**
 * Returns the first value in `array` that passes an async truth test.
 * The `iterator` is applied in parallel, meaning the first iterator to return `true` resolve the global `find` Promise. 
 * That means the result might not be the first item in the original `array` (in terms of order) that passes the test.
 * If order within the original `array` is important, then look at `findSeries`.
 */
export default function find<T>(array: T[], iterator: AsyncListIterator<T, boolean>): Promise<T | undefined> {
    const len = array.length;
    let count = 0;

    return new Promise<T | undefined>((resolve, reject) => {
        array.forEach(finder);

        function finder(value: T, index: number, list: T[]): Promise<void> {
            return exec(iterator, value, index, list).then(valid => {
                if (valid) {
                    return resolve(value);
                }

                if (++count === len) {
                    resolve();
                }
            }, reject);
        }
    });
}
