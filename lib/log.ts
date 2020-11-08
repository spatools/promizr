import type { Async, AsyncFunction } from "./_types";

import exec from "./exec";

/**
 * @public
 * 
 * Utility function to log the result or the error of the given `task`.
 * If the `task` succeeds, its result is returned.
 * If the `task` failed, the error is thrown.
 * 
 * @param task - The task to call
 * @param args - The arguments to pass to the task
 */
export default function log<T extends AsyncFunction>(task: T, ...args: Parameters<T>): Async<T> {
    return exec(task, ...args).then(
        result => {
            console.log(result);
            return result;
        },
        err => {
            console.error(err);
            throw err;
        }
    );
}
