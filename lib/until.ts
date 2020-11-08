import type { AsyncTask } from "./_types";

import exec from "./exec";

/**
 * The opposite of {@link whilst}.
 * Calls the `task` function until the `test` function returns `true`.
 * 
 * @param test - The function that test if the process should continue
 * @param task - The task to execute while `test` fails
 */
export default function until<T>(test: AsyncTask<boolean>, task: AsyncTask<T>): Promise<void> {
    return next();

    function next(): Promise<void> {
        return exec(test).then(doContinue => {
            if (!doContinue) {
                return exec(task).then(next);
            }
        });
    }
}
