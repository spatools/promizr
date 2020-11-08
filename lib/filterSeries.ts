import type { AsyncListIterator } from "./_types";

import resolve from "./resolve";
import eachSeries from "./eachSeries";

/**
 * The same as {@link filter} only the `iterator` is applied to each item in `array` in series.
 * The next `iterator` is only called once the current one has completed.
 * The results array will be in the same order as the original.
 * 
 * @param array - The array to iterate on
 * @param iterator - The iterator which test each item
 */
export default function filterSeries<T>(array: T[], iterator: AsyncListIterator<T, boolean>): Promise<T[]> {
    const results: T[] = [];

    return eachSeries(array, filterr).then(() => results);

    function filterr(item: T, index: number): Promise<void> {
        return resolve(iterator(item, index, array)).then(include => {
            if (include) results.push(item);
        });
    }
}
