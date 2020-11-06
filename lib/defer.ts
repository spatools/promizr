import type { Deferred } from "./_types";

/**
 * Returns a new Deferred object.
 * 
 * A Deferred object is an object containing 3 properties: `resolve`, `reject` and `promise`.
 * The `resolve` function resolves the `promise`.
 * The `reject` function rejects the `promise`.
 */
export default function defer<T>(): Deferred<T> {
    const dfd: any = {};

    dfd.promise = new Promise((resolve, reject) => {
        dfd.resolve = resolve;
        dfd.reject = reject;
    });

    return dfd;
}
