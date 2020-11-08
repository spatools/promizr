
import type { AsyncReduceIterator } from "./_types";

import resolve from "./resolve";
import eachSeries from "./eachSeries";

/**
 * @public
 * 
 * Same as {@link reduce}, only operates on `array` in reverse order.
 * 
 * @param array - The array to iterate on
 * @param memo - The starting value for the reduce operation
 * @param iterator - The function that reduce each item and return the reduced result
 */
export default function reduceRight<T, U>(array: T[], memo: U, iterator: AsyncReduceIterator<T, U>): Promise<U> {
    return eachSeries([...array].reverse(), reducer).then(() => memo);

    function reducer(item: T, index: number): Promise<void> {
        return resolve(iterator(memo, item, index, array)).then(result => {
            memo = result;
        });
    }
}
