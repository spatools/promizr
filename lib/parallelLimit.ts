import type { AsyncTask, AwaitedObject, QueueOptions } from "./_types";

import TaskQueue from "./TaskQueue";
import Queue from "./Queue";

import execOn from "./execOn";

/**
 * @public
 * 
 * Sames as {@link parallel} but limit the number of tasks that run concurrently.
 * 
 * Note: The resulting array may not be in the same order as the source array.
 * 
 * @param tasks - The array of tasks to execute
 * @param limit - The maximum number of tasks to run concurrently
 * @param options - The options for the inner TaskQueue
 */
export default function parallelLimit<T>(tasks: Array<AsyncTask<T>>, limit: number, options?: QueueOptions): Promise<T[]>;

/**
 * @public
 * 
 * Sames as {@link parallel} but limit the number of tasks that run concurrently.
 * 
 * @param tasks - An object that contains AsyncTask
 * @param limit - The maximum number of tasks to run concurrently
 * @param options - The options for the inner Queue
 */
export default function parallelLimit<T extends Record<string, unknown>>(tasks: T, limit: number, options?: QueueOptions): Promise<AwaitedObject<T>>;

/**
 * @public
 * 
 * Sames as {@link parallel} but limit the number of tasks that run concurrently.
 * 
 * @param tasks - The array or object containing tasks to execute
 * @param limit - The maximum number of tasks to run concurrently
 * @param options - The options for the inner TaskQueue
 */
export default function parallelLimit(tasks: AsyncTask[] | Record<string, AsyncTask>, limit: number, options?: QueueOptions): Promise<unknown[] | AwaitedObject<unknown>> {
    options = options || { stopOnError: true };

    if (Array.isArray(tasks)) {
        const queue = new TaskQueue(limit, options);
        return queue.push(tasks);
    }

    const obj = tasks;
    const result: Record<string, unknown> = {};

    const queue = new Queue(worker, limit, options);
    return queue.push(Object.keys(obj)).then(() => result);

    function worker(key: string): Promise<void> {
        return execOn(obj, obj[key]).then(res => {
            result[key] = res;
        });
    }
}
