import type { AsyncTask } from "./_types";

import resolve from "./resolve";

/**
 * The same as `times`, only `tasks` are applied in series.
 * The next `task` is only called once the current one has completed.
 */
export default function timesSeries<T>(times: number, task: AsyncTask<T>): Promise<T[]> {
    const results: T[] = [];

    let p = resolve();
    for (let i = times; i > 0; i--) {
        p = p.then(capture);
    }

    return p.then(() => results);

    function capture(): Promise<void> {
        return resolve(task()).then(result => { results.push(result); });
    }
}
