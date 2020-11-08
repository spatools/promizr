import type { AsyncListIterator } from "./_types";

import resolve from "./resolve";
import eachSeries from "./eachSeries";

/**
 * The same as {@link reject}, only the `iterator` is applied to each item in `array` in series.
 * 
 * @param array - The array to iterate on
 * @param iterator - The iterator which test each item
 */
export default function rejectSeries<T>(array: T[], iterator: AsyncListIterator<T, boolean>): Promise<T[]> {
    const results: T[] = [];

    return eachSeries(array, rejecter).then(() => results);

    function rejecter(item: T, index: number, list: T[]): Promise<void> {
        return resolve(iterator(item, index, list)).then(include => {
            if (!include) results.push(item);
        });
    }
}
