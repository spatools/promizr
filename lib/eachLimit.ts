import type { AsyncListIterator, QueueOptions } from "./_types";

import TaskQueue from "./TaskQueue";

/**
 * @public
 * 
 * Sames as {@link each} but limit the number of concurrent iterator.
 * 
 * @param array - The array to iterate on
 * @param limit - The maximum number of iterator to run concurrently
 * @param iterator - The iterator to apply on each item
 * @param options - The options for the inner TaskQueue
 */
export default function eachLimit<T>(array: T[], limit: number, iterator: AsyncListIterator<T, unknown>, options?: QueueOptions): Promise<void> {
    const queue = new TaskQueue(limit, options || { stopOnError: true });

    const iterators = array.map((value, index, list) => () => iterator(value, index, list));
    return queue.push(iterators).then(() => void 0);
}
