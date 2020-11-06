import type { Async } from "./_types";
import type { MethodNames, Func } from "./_internal";

import execOn from "./execOn";

/**
 * Same as {@link apply} but call the `task` with `owner` `this` context.
 * If task is a string, it calls `owner[task]` function.
 * 
 * @param owner - `this` context to use when calling `task`
 * @param task - The property name of function in `owner`
 * @param args - The `task` argument
 */
export default function applyOn<O, K extends MethodNames<O>>(owner: O, task: K, ...args: Parameters<O[K]>): () => Async<ReturnType<O[K]>>;

/**
 * Same as {@link apply} but call the `task` with `owner` `this` context
 * 
 * @param owner - `this` context to use when calling `task`
 * @param task - The function to apply
 * @param args - The `task` argument
 */
export default function applyOn<O, T extends Func>(owner: O, task: T, ...args: Parameters<T>): () => Async<ReturnType<T>>;

export default function applyOn(owner: Record<string, Func>, taskOrFunction: string | Func, ...args: any[]): () => Async<unknown> {
    const task = typeof taskOrFunction === "string" ? owner[taskOrFunction] : taskOrFunction;
    return () => execOn(owner, task, ...args);
}
