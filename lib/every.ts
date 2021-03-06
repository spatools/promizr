import type { AsyncListIterator } from "./_types";

import exec from "./exec";
import find from "./find";

/**
 * @public
 * 
 * Returns `true` if every element in `array` satisfies an async test.
 * 
 * @param array - The array to iterate on
 * @param iterator - The iterator which test each item
 */
export default function every<T>(array: T[], iterator: AsyncListIterator<T, boolean>): Promise<boolean> {
    return find(array, invert).then(result => !result);

    function invert(item: T, index: number, list: T[]): Promise<boolean> {
        return exec(iterator, item, index, list).then(result => !result);
    }
}
