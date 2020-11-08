import type { AsyncListIterator } from "./_types";

import resolve from "./resolve";

/**
 * @public
 * 
 * The same as {@link each}, only `iterator` is applied to each item in `array` in series.
 * The next `iterator` is only called once the current one has completed.
 * This means the `iterator` functions will complete in order.
 * 
 * @param array - The array to iterate on
 * @param iterator - The iterator to apply on each item
 */
export default function eachSeries<T>(array: T[], iterator: AsyncListIterator<T, unknown>): Promise<void> {
    return new Promise<void>((res, reject) => {
        const len = array.length;

        let p: Promise<unknown> = resolve();
        for (let i = 0; i < len; i++) {
            p = p.then(createIterator(array[i], i, array));
        }

        return p.then(() => res(), reject);

        function createIterator(value: T, index: number, list: T[]): () => unknown | Promise<unknown> {
            return () => iterator(value, index, list);
        }
    });
}
