import type { AsyncListIterator } from "./_types";

import exec from "./exec";
import find from "./find";

/**
 * Returns `true` if every element in `array` satisfies an async test.
 */
export default function every<T>(array: T[], iterator: AsyncListIterator<T, boolean>): Promise<boolean> {
    return find(array, invert).then(result => !result);

    function invert(item: T, index: number, list: T[]): Promise<boolean> {
        return exec(iterator, item, index, list).then(result => !result);
    }
}
