
import type { AsyncReduceIterator } from "./_types";

import resolve from "./resolve";
import eachSeries from "./eachSeries";

/**
 * Same as `reduce`, only operates on `array` in reverse order.
 */
export default function reduceRight<T, U>(array: T[], memo: U, iterator: AsyncReduceIterator<T, U>): Promise<U> {
    return eachSeries([...array].reverse(), reducer).then(() => memo);

    function reducer(item: T, index: number): Promise<void> {
        return resolve(iterator(memo, item, index, array)).then(result => {
            memo = result;
        });
    }
}
