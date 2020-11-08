import type { AsyncTask, PriorityQueueOptions } from "./_types";

import PriorityQueue from "./PriorityQueue";

/**
 * @public
 * 
 * The same as {@link PriorityQueue} but items are the tasks to execute.
 */
export default class PriorityTaskQueue<T> extends PriorityQueue<AsyncTask<T>, T> {

    /**
     * Creates a new PriorityTaskQueue.
     * 
     * @param limit - The maximum number of concurrent tasks to launch
     * @param options - The options for the PriorityTaskQueue
     */
    constructor(limit?: number, options?: PriorityQueueOptions) {
        super(item => item(), limit, options);
    }

}
