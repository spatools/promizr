import type { Async, AsyncFunction } from "./_types";
import type { GetLastReturnType } from "./_internal";

import resolve from "./resolve";

/**
 * Calls each `task` using the result of the previous `task`.
 * Resolves with the result of the last `task`.
 * The first `task` should not take any argument. 
 */
export default function waterfall<T extends AsyncFunction[]>(tasks: T): Async<GetLastReturnType<T>> {
    let p: Promise<any> = resolve();

    for (const task of tasks) {
        p = p.then(task);
    }

    return p;
}
