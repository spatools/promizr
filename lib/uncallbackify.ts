import cbpromisify from "./cbpromisify";

import type { FunctionWithMultiCallbacks, FunctionWithMultiCallbacksReturnType, ParametersWithoutLast2 } from "./_internal";
import type { Async } from "./_types";

/**
 * Same as {@link cbpromisify} but call the function immediately.
 * 
 * @param fn - The function to promisify
 * @param args - The arguments to pass to fn
 */
export default function uncallbackify<T extends FunctionWithMultiCallbacks>(fn: T, ...args: ParametersWithoutLast2<T>): Async<FunctionWithMultiCallbacksReturnType<T>>;
/**
 * Same as {@link promisify} but call the function immediately.
 * 
 * @param owner - The `this` context to use when calling fn
 * @param fn - The function to promisify
 * @param args - The arguments to pass to fn
 */
export default function uncallbackify<O extends Record<string, unknown>, T extends FunctionWithMultiCallbacks>(owner: O, fn: T, ...args: ParametersWithoutLast2<T>): Async<FunctionWithMultiCallbacksReturnType<T>>;

export default function uncallbackify(ownerOrFn: Record<string, unknown> | undefined, ...args: unknown[]): Promise<any> {
    let owner = ownerOrFn,
        fn = args[0] as FunctionWithMultiCallbacks,
        num = 1;

    if (typeof owner === "function" && typeof fn !== "function") {
        fn = owner;
        owner = undefined;
        num = 0;
    }

    return cbpromisify(owner, fn)(...args.slice(num));
}
