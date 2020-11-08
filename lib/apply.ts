import type { Async } from "./_types";
import type { Func } from "./_internal";

import exec from "./exec";

/**
 * @public
 * 
 * Create a new Task which exec `task` with given arguments.
 * 
 * @param action - The function to apply
 * @param args - The `task` argument
 * 
 * @example
 * ```typescript
 * const action = (value: string, upperCase: boolean) => upperCase ? value.toUpperCase() : value;
 * 
 * const task = promizr.apply(action, "value", true);
 * 
 * const res = await task();
 * // res === "VALUE"
 * ```
 */
export default function apply<T extends Func>(action: T, ...args: Parameters<T>): () => Async<ReturnType<T>> {
    return () => exec(action, ...args);
}
