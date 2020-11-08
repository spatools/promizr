import type { AsyncTask } from "./_types";

import exec from "./exec";

/**
 * @public
 * 
 * Executes `task` the given number of `times`.
 * Returns an array with the result of each `task` execution.
 * 
 * @param times - The number of times `task` should be called
 * @param task - The task to run multiple times
 */
export default function times<T>(times: number, task: AsyncTask<T>): Promise<T[]> {
    const results: Array<Promise<any>> = [];

    for (let i = times; i > 0; i--) {
        results.push(exec(task));
    }

    return Promise.all(results);
}
