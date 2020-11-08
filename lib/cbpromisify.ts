
import type { FunctionWithMultiCallbacks, FunctionWithMultiCallbacksReturnType, ParametersWithoutLast2 } from "./_internal";
import type { Async } from "./_types";

/**
 * @public
 * 
 * Build a function that transform a multi-callback style function to a Promise version.
 * 
 * @param fn - The function to promisify
 */
export default function cbpromisify<T extends FunctionWithMultiCallbacks>(fn: T): (...args: ParametersWithoutLast2<T>) => Async<FunctionWithMultiCallbacksReturnType<T>>;

/**
 * @public
 * 
 * Build a function that transform a multi-callback style function to a Promise version.
 * 
 * @param owner - The `this` context to use when calling `fn`
 * @param fn - The function to promisify
 */
export default function cbpromisify<O, T extends FunctionWithMultiCallbacks>(owner: O, fn: T): (...args: ParametersWithoutLast2<T>) => Async<FunctionWithMultiCallbacksReturnType<T>>;

export default function cbpromisify<T extends FunctionWithMultiCallbacks>(owner: Record<string, unknown> | undefined, fn?: T): (...args: ParametersWithoutLast2<T>) => Async<FunctionWithMultiCallbacksReturnType<T>> {
    if (typeof owner === "function" && typeof fn !== "function") {
        fn = owner;
        owner = undefined;
    }

    if (!fn) {
        throw new TypeError("fn should be provided!");
    }

    const executor = fn;
    return (...args) => {
        return new Promise((resolve, reject) => {
            executor.apply(owner, [...args, success, error]);

            function success(...results: any[]): void {
                if (results.length === 0) return resolve();
                if (results.length === 1) return resolve(results[0]);
                resolve(results as any);
            }

            function error(...errors: any[]): void {
                if (errors.length === 1) {
                    return reject(errors[0]);
                }

                reject(errors);
            }
        });
    };
}
