import type { AsyncListIterator } from "./_types";

import mapSeries from "./mapSeries";

/**
 * @public
 * 
 * Same as {@link concat}, but executes in series instead of parallel.
 * 
 * @param array - The array to iterate on
 * @param iterator - An iterator which returns arrays
 */
export default function concatSeries<T, U>(array: T[], iterator: AsyncListIterator<T, U[]>): Promise<U[]> {
    return mapSeries(array, iterator)
        .then(results => ([] as U[]).concat(...results.filter(a => !!a)));
}
