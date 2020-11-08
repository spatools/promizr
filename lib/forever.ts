import type { AsyncTask } from "./_types";

import exec from "./exec";

/**
 * @public
 * 
 * Calls the `task` indefinitely.
 * Note: if `task` throws, the process stops.
 * 
 * @param task - The task to execute until it fails
 */
export default function forever<T>(task: AsyncTask<T>): Promise<never> {
    return next();

    function next(): Promise<never> {
        return exec(task).then(next);
    }
}
