import type { AsyncListIterator } from "./_types";

import resolve from "./resolve";
import map from "./map";

/**
 * Sorts a list by the results of running each `array` value through an async `iterator`.
 * 
 * @param array - The array to iterate on
 * @param iterator - The function which returns the sort index
 */
export default function sortBy<T, U>(array: T[], iterator: AsyncListIterator<T, U>): Promise<T[]> {
    return map(array, sortMapper).then(result => result.sort(sortFunction).map(i => i.source));

    function sortMapper(item: T, index: number): Promise<SortItem<T, U>> {
        return resolve(iterator(item, index, array))
            .then(res => ({ source: item, result: res }));
    }

    function sortFunction(left: SortItem<T, U>, right: SortItem<T, U>): number {
        const a = left.result, b = right.result;
        return a < b ? -1 : a > b ? 1 : 0;
    }
}

interface SortItem<T, U> {
    source: T;
    result: U;
}
