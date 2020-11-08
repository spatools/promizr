import type { AsyncFunction } from "./_types";
import type { MethodNames } from "./_internal";

import execOn from "./execOn";

/**
 * @public
 * 
 * The sames as {@link tap} but apply the `task` with `owner` as this context.
 *  
 * @param owner - The this context to apply when calling the task
 * @param task - The key on owner that contains the function to be called during tap
 * @param args - The arguments to apply to task
 */
export default function tapOn<O, K extends MethodNames<O>>(owner: O, task: K, ...args: Parameters<O[K]>): <U>(arg: U) => Promise<U>;

/**
 * @public
 * 
 * The sames as {@link tap} but apply the `task` with `owner` as this context.
 *  
 * @param owner - The this context to apply when calling the task
 * @param task - The function to be called during tap
 * @param args - The arguments to apply to task
 */
export default function tapOn<O, T extends AsyncFunction>(owner: O, task: T, ...args: Parameters<T>): <U>(arg: U) => Promise<U>;

export default function tapOn<U>(owner: Record<string, AsyncFunction>, taskOrFunction: string | AsyncFunction, ...args: any[]): (arg: U) => Promise<U> {
    const task = typeof taskOrFunction === "string" ? owner[taskOrFunction] : taskOrFunction;
    return (res) => execOn(owner, task, ...args).then(() => res);
}
