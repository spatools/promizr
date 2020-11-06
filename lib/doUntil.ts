import type { AsyncTask } from "./_types";

import exec from "./exec";

/**
 * The opposite of `doWhilst`.
 * Calls the `task` function until the `test` function returns `true`.
 * 
 * Note: `test` is called after the first task.
 */
export default function doUntil<T>(task: AsyncTask<T>, test: (res: T) => boolean | Promise<boolean>): Promise<void> {
    return next();

    function next(): Promise<void> {
        return exec(task)
            .then(res => test(res as T))
            .then(doContinue => {
                if (!doContinue) {
                    return next();
                }
            });
    }
}

