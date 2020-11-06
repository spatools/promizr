import type { Awaited, Async, AsyncFunction } from "./_types";

import resolve from "./resolve";
import exec from "./exec";

type HashFunction = (args: any[]) => string;

/**
 * Prepare a function that call the `task` and memoize the result to avoid calling it again.
 * If `hash` is `true`, memoize the result based on a hash of input arguments (default hash function: `JSON.stringify(args)`).
 * If `hash` is a function, memoize the result based on the hash returned by the function (signature: (args: any[]) => string).
 * 
 * Note: The `hash` function is synchronous.
 * 
 * @param task - The task to memoize
 * @param hash - `true` to enable simple arguments hashing (JSON.stringify), or a function to hash arguments
 */
export default function memoize<T extends AsyncFunction>(task: T, hash?: boolean | HashFunction): (...args: Parameters<T>) => Async<ReturnType<T>> {
    const cache: Record<string, Awaited<ReturnType<T>> | Async<ReturnType<T>>> = {};
    const hasher: HashFunction | undefined = typeof hash === "function" ? hash : hash === true ? JSON.stringify : undefined;

    return (...args: Parameters<T>) => {
        const hashed = hasher?.(args);
        const cached = cache[hashed || "default"];

        if (cached) {
            return resolve(cached);
        }

        const promise = exec(task, ...args)
            .then(res => save(cache, hashed, res));

        return save(cache, hashed, promise);
    }
}

function save<T extends AsyncFunction>(cache: Record<string, Awaited<ReturnType<T>> | Async<ReturnType<T>>>, hashed: string | undefined, value: Awaited<ReturnType<T>> | Async<ReturnType<T>>): typeof value {
    cache[hashed || "default"] = value;
    return value;
}
