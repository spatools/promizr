import type { AsyncTask, QueueOptions } from "./_types";

import Queue from "./Queue";

export default class TaskQueue<T> extends Queue<AsyncTask<T>, T> {

    /**
     * Creates a new  TaskQueue.
     * 
     * @param limit The maximum number of concurrent tasks to launch
     * @param options The options for the TaskQueue
     */
    constructor(limit?: number, options?: QueueOptions) {
        super(item => item(), limit, options);
    }

}
