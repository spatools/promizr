import type { AsyncListIterator } from "./_types";

import mapSeries from "./mapSeries";

/**
 * Same as `concat`, but executes in series instead of parallel.
 */
export default function concatSeries<T, U>(array: T[], iterator: AsyncListIterator<T, U[]>): Promise<U[]> {
    return mapSeries(array, iterator)
        .then(results => ([] as U[]).concat(...results.filter(a => !!a)));
}
