import promisify from "./promisify";

import type { FunctionWithNodeStyleCallback, FunctionWithNodeStyleCallbackReturnType, ParametersWithoutLast } from "./_internal";
import type { Async } from "./_types";

/**
 * @public
 * 
 * Same as {@link promisify} but call the function immediately.
 * 
 * @param fn - The function to promisify
 * @param args - The arguments to pass to fn
 */
export default function denodify<T extends FunctionWithNodeStyleCallback>(fn: T, ...args: ParametersWithoutLast<T>): Async<FunctionWithNodeStyleCallbackReturnType<T>>;

/**
 * @public
 * 
 * Same as {@link promisify} but call the function immediately.
 * 
 * @param owner - The `this` context to use when calling fn
 * @param fn - The function to promisify
 * @param args - The arguments to pass to fn
 */
export default function denodify<O extends Record<string, unknown>, T extends FunctionWithNodeStyleCallback>(owner: O, fn: T, ...args: ParametersWithoutLast<T>): Async<FunctionWithNodeStyleCallbackReturnType<T>>;

export default function denodify(ownerOrFn: Record<string, unknown> | undefined, ...args: unknown[]): Promise<any> {
    let owner = ownerOrFn,
        fn = args[0] as FunctionWithNodeStyleCallback,
        num = 1;

    if (typeof owner === "function" && typeof fn !== "function") {
        fn = owner;
        owner = undefined;
        num = 0;
    }

    return promisify(owner, fn)(...args.slice(num));
}
