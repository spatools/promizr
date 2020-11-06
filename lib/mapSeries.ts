import type { AsyncListIterator } from "./_types";

import resolve from "./resolve";
import eachSeries from "./eachSeries";

/**
 * The same as `map`, only the `iterator` is applied to each item in `array` in series.
 * The next `iterator` is only called once the current one has completed.
 * The results array will be in the same order as the original.
 */
export default function mapSeries<T, U>(array: T[], iterator: AsyncListIterator<T, U>): Promise<U[]> {
    const results: U[] = [];

    return eachSeries(array, mapper).then(() => results);

    function mapper(item: T, index: number, list: T[]): Promise<void> {
        return resolve(iterator(item, index, list)).then(result => {
            results[index] = result;
        });
    }
}
