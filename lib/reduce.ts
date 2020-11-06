
import type { AsyncReduceIterator } from "./_types";

import resolve from "./resolve";
import eachSeries from "./eachSeries";

/**
 * Reduces `array` into a single value using an async `iterator` to return each successive step.
 * `memo` is the initial state of the reduction.
 * This function only operates in series.
 * 
 * For performance reasons, it may make sense to split a call to this function into a parallel map, 
 * and then use the normal `Array.prototype.reduce` on the results. 
 * 
 * This function is for situations where each step in the reduction needs to be async; 
 * if you can get the data before reducing it, then it's probably a good idea to do so.
 */
export default function reduce<T, U>(array: T[], memo: U, iterator: AsyncReduceIterator<T, U>): Promise<U> {
    return eachSeries(array, reducer).then(() => memo);

    function reducer(item: T, index: number, list: T[]): Promise<void> {
        return resolve(iterator(memo, item, index, list)).then(result => {
            memo = result;
        });
    }
}
