import type { FunctionWithNodeStyleCallback, FunctionWithNodeStyleCallbackReturnType, ParametersWithoutLast } from "./_internal";
import type { Async } from "./_types";

/**
 * Build a function that transform a Node-Style callback function to a Promise version.
 * 
 * @param fn - The function to promisify
 */
export default function promisify<T extends FunctionWithNodeStyleCallback>(fn: T): (...args: ParametersWithoutLast<T>) => Async<FunctionWithNodeStyleCallbackReturnType<T>>;

/**
 * Build a function that transform a Node-Style callback function to a Promise version.
 * 
 * @param owner - The `this` context to use when calling `fn`
 * @param fn - The function to promisify
 */
export default function promisify<O, T extends FunctionWithNodeStyleCallback>(owner: O, fn: T): (...args: ParametersWithoutLast<T>) => Async<FunctionWithNodeStyleCallbackReturnType<T>>;

export default function promisify<T extends FunctionWithNodeStyleCallback>(owner: Record<string, unknown> | undefined, fn?: T): (...args: ParametersWithoutLast<T>) => Async<FunctionWithNodeStyleCallbackReturnType<T>> {
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
            executor.apply(owner, [...args, callback]);

            function callback(err: Error, ...results: any[]): void {
                if (err) return reject(err);
                if (results.length === 0) return resolve();
                if (results.length === 1) return resolve(results[0]);

                resolve(results as any);
            }
        });
    };
}
