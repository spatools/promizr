import type { Async } from "./_types";
import type { Func, PartialParameters, RestOfParameters } from "./_internal";

import exec from "./exec";

/**
 * @public
 * 
 * Create a new function which exec `task` by combining arguments.
 * 
 * @param task - the function to partialize
 * @param preArgs - arguments to bind to task
 */
export default function partial<Method extends Func, Arguments extends PartialParameters<Method>>(task: Method, ...preArgs: Arguments): (...args: RestOfParameters<Method, Arguments>) => Async<ReturnType<Method>> {
    return (...args) => {
        return exec(task, ...preArgs.concat(args) as Parameters<Method>);
    };
}
