import type { AsyncListIterator } from "./_types";

import find from "./find";

/**
 * @public
 * 
 * Returns `true` if at least one element in the `array` satisfies an async test.
 * The `Promise` returned by each `iterator` call can only returns boolean value!
 * Once any iterator call returns `true`, the main `Promise` is resolved.
 * 
 * @param array - The array to iterate on
 * @param iterator - The iterator which test each item
 */
export default function some<T>(array: T[], iterator: AsyncListIterator<T, boolean>): Promise<boolean> {
    return find(array, iterator).then(result => !!result);
}
