import type { AsyncTask } from "./_types";

import exec from "./exec";

/**
 * @public
 * 
 * Executes the `task` and retry if failed.
 * If `task` fails the given number of `times`, the promise is rejected.
 * 
 * @param times - The number of times the `task` should be retried
 * @param task - The task to retry if it fails
 */
export default function retry<T>(times: number, task: AsyncTask<T>): Promise<T> {
    return exec(task).catch(err => {
        if (times > 1) {
            return retry(times - 1, task);
        }

        throw err;
    }) as Promise<T>;
}
