import type { AsyncTask, AwaitedObject } from "./_types";

import resolve from "./resolve";

/**
 * Run given tasks in parallel and resolves with an array of the results of each task.
 * 
 * @param tasks - The array of functions to execute in parallel
 */
export default function series<T>(tasks: Array<AsyncTask<T>>): Promise<T[]>;

/**
 * Run found tasks in given object in series and resolves with an object where all tasks are resolved to their values.
 * 
 * @param obj - The object which contains tasks to execute in parallel
 */
export default function series<T extends Record<string, unknown>>(tasks: T): Promise<AwaitedObject<T>>;

export default function series(tasks: AsyncTask[] | Record<string, unknown>): Promise<unknown> {
    return Array.isArray(tasks) ?
        listSeries(tasks) :
        objectSeries(tasks);
}

function listSeries<T>(array: Array<AsyncTask<T>>): Promise<T[]> {
    const results: T[] = [];
    const len = array.length;

    let p = resolve();
    for (let i = 0; i < len; i++) {
        p = p.then(createIterator(array[i]));
    }

    return p.then(() => results);

    function createIterator(executor: AsyncTask<T>): () => Promise<void> {
        return () => {
            return resolve(executor()).then(result => { results.push(result); });
        };
    }
}

function objectSeries<T extends Record<string, unknown>>(obj: T): Promise<AwaitedObject<T>> {
    const results: Record<string, unknown> = {};
    let p = resolve();

    for (const key in obj) {
        if (typeof obj[key] === "function") {
            p = p.then(createIterator(key, obj[key] as AsyncTask<T>));
        }
    }

    return p.then(() => results as AwaitedObject<T>);

    function createIterator(key: string, executor: AsyncTask<T>): () => Promise<void> {
        return () => {
            return resolve(executor()).then(result => { results[key] = result; });
        }
    }
}
