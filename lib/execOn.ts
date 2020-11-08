import type { Async, AsyncFunction } from "./_types";

import resolve from "./resolve";

/**
 * @public
 * 
 * Sames as {@link exec} but use `owner` as `this` context when calling `task`.
 *  
 * @param owner - The this context
 * @param task - The function to call
 * @param args - The arguments to pass to task
 */
export default function execOn<T extends AsyncFunction>(owner: unknown, task: T, ...args: Parameters<T>): Async<ReturnType<T>> {
    try {
        return resolve(task.apply(owner, args));
    }
    catch (err) {
        return Promise.reject(err);
    }
}
