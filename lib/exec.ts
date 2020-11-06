import type { Async } from "./_types";
import type { Func } from "./_internal";

import resolve from "../lib/resolve";

/**
 * Execute `task` with given arguments by ensuring that the result is a Promise.
 * If task throws synchronously, it's wrapped as a Promise.
 *  
 * @param task - The function to call
 * @param args - The arguments to pass to task
 */
export default function exec<T extends Func>(task: T, ...args: Parameters<T>): Async<ReturnType<T>> {
    try {
        return resolve(task(...args));
    }
    catch (err) {
        return Promise.reject(err);
    }
}
