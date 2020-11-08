import type { AsyncFunction } from "./_types";

import exec from "./exec";

/**
 * @public
 * 
 * Build a function that takes an argument, calls the `task` and resolve with the input argument.
 * This function is usefull to call a function during a Promise chain without breaking the chain.
 * 
 * @example
 * ```typescript
 * return myAwesomeTask()
 *     .then(result => `prefix-${result}`)
 *     .then(promizr.tap(logActionToServer, token))
 *     .then(result => result.startsWith("prefix-"));
 * ```
 * 
 * @param task - The function to be called during tap.
 * @param args - The arguments to be called to task.
 */
export default function tap<Task extends AsyncFunction>(task: Task, ...args: Parameters<Task>): <U>(arg: U) => Promise<U> {
    return (result) => exec(task, ...args).then(() => result);
}
