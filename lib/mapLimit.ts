import type { AsyncListIterator, QueueOptions } from "./_types";

import TaskQueue from "./TaskQueue";

/**
 * Sames as {@link map} but limit the number of iterators that run concurrently.
 * 
 * Note: The resulting array may not be in the same order as the source array.
 * 
 * @param array The array to iterate on
 * @param limit The maximum number of iterator to run concurrently
 * @param iterator The iterator that map each item
 * @param options The options for the inner TaskQueue
 */
export default function mapLimit<T, U>(array: T[], limit: number, iterator: AsyncListIterator<T, U>, options?: QueueOptions): Promise<U[]> {
    const queue = new TaskQueue<U>(limit, options || { stopOnError: true });

    const iterators = array.map((value, index, list) => () => iterator(value, index, list));
    return queue.push(iterators);
}
