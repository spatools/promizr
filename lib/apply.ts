import type { Async } from "./_types";
import type { Func } from "./_internal";

import exec from "./exec";

/**
 * Create a new Task which exec `task` with given arguments.
 * 
 * @param task - The function to apply
 * @param args - The `task` argument
 */
export default function apply<T extends Func>(task: T, ...args: Parameters<T>): () => Async<ReturnType<T>> {
    return () => exec(task, ...args);
}
