import type { AsyncTask } from "./_types";

import exec from "./exec";

/**
 * Equivalent of `while` loop.
 * Calls the `task` function while the `test` function returns `true`.
 */
export default function whilst<T>(test: AsyncTask<boolean>, task: AsyncTask<T>): Promise<void> {
    return next();

    function next(): Promise<void> {
        return exec(test).then(doContinue => {
            if (doContinue) {
                return exec(task).then(next);
            }
        });
    }
}
