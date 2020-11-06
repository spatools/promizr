import type { AsyncTask, AwaitedObject } from "./_types";

import exec from "./exec";

export default function parallel<T>(tasks: Array<AsyncTask<T>>): Promise<T[]>;
export default function parallel<T extends Record<string, unknown>>(tasks: T): Promise<AwaitedObject<T>>;
export default function parallel(tasks: AsyncTask[] | Record<string, unknown>): Promise<unknown> {
    return Array.isArray(tasks) ?
        listParallel(tasks) :
        objectParallel(tasks);
}

function listParallel<T>(array: Array<AsyncTask<T>>): Promise<T[]> {
    const promises = array.map(task => exec(task));
    return Promise.all(promises as Array<Promise<T>>);
}

function objectParallel<T extends Record<string, unknown>>(obj: T): Promise<AwaitedObject<T>> {
    const results: Record<string, unknown> = {};
    const promises: Array<Promise<void>> = []

    for (const key in obj) {
        if (typeof obj[key] === "function") {
            promises.push(interator(key, obj[key] as AsyncTask<T>));
        }
    }

    return Promise.all(promises).then(() => results as AwaitedObject<T>);

    function interator(key: string, executor: AsyncTask<T>): Promise<void> {
        return exec(executor).then(result => { results[key] = result; });
    }
}
