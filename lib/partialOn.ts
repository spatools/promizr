import type { Async } from "./_types";
import type { Func, MethodNames, PartialParameters, RestOfParameters } from "./_internal";

import execOn from "./execOn";

/**
 * @public
 * 
 * Same as {@link partial} but call the `task` with `owner` `this` context.
 * If task is a string, it calls `owner[task]` function.
 * 
 * @param owner - `this` context to use when calling `task`
 * @param task - The property name of function in `owner`
 * @param args - The `task` arguments
 */
export default function partialOn<O, Key extends MethodNames<O>, Arguments extends PartialParameters<O[Key]>>(owner: O, task: Key, ...args: Arguments): (...args: RestOfParameters<O[Key], Arguments>) => Async<ReturnType<O[Key]>>;

/**
 * @public
 * 
 * Same as {@link partial} but call the `task` with `owner` `this` context
 * 
 * @param owner - `this` context to use when calling `task`
 * @param task - The function to partialize
 * @param args - The `task` arguments
 */
export default function partialOn<O, Method extends Func, Arguments extends PartialParameters<Method>>(owner: O, task: Method, ...args: Arguments): (...args: RestOfParameters<Method, Arguments>) => Async<ReturnType<Method>>;

export default function partialOn(owner: Record<string, Func>, taskOrFunction: string | Func, ...topArgs: any[]): (...args: unknown[]) => Async<unknown> {
    const task = typeof taskOrFunction === "string" ? owner[taskOrFunction] : taskOrFunction;
    return (...args) => execOn(owner, task, ...topArgs.concat(args));
}
