import { ensure } from "./utils";

/** Base List Iterator for promizr */
export type PromiseListIterator<T, U> = (item: T, index: number, list: T[]) => U | Promise<U>;

/** Iterator for promizr.reduce */
export type PromiseReduceIterator<T, U> = (memo: U, item: T) => U | Promise<U>;

/**
 * Applies the function `iterator` to each item in `arr`, in parallel.
 * The `iterator` is called with an item from the list, the index of this item and the list itself.
 * If the `iterator` emit a rejected Promise, the each function `Promise` result is instantly rejected.
 * 
 * Note, that since this function applies `iterator` to each item in parallel, there is no guarantee that the iterator functions will complete in order.
 */
export function each<T>(array: T[], iterator: PromiseListIterator<T, unknown>): Promise<void> {
    const promises = array.map(iterator);
    return Promise.all(promises).then(() => void 0);
}

/** @alias each */
export const forEach = each;

/**
 * The same as  each , only `iterator` is applied to each item in `array` in series.
 * The next `iterator` is only called once the current one has completed.
 * This means the `iterator` functions will complete in order.
 */
export function eachSeries<T>(array: T[], iterator: PromiseListIterator<T, unknown>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const len = array.length;
        let p = ensure();
        for (let i = 0; i < len; i++) {
            p = p.then(partial(array[i], i));
        }

        return p.then(() => resolve(), reject);

        function partial(value: T, index: number): () => Promise<unknown> {
            return () => ensure(iterator(value, index, array));
        }
    });
}

/** @alias eachSeries */
export const forEachSeries = each;

/**
 * Produces a new array of values by mapping each value in  array  through the  iterator  function.
 * The  iterator  is called with an item from the list, the index of this item and the list itself.
 * If the  iterator  emit a rejected Promise, the each function Promise result is instantly rejected.
 * 
 * Note, that since this function applies the  iterator  to each item in parallel, there is no guarantee that the  iterator  functions will complete in order.
 * However, the results array will be in the same order as the original  arr .
 */
export function map<T, U>(array: T[], iterator: PromiseListIterator<T, U>): Promise<U[]> {
    const promises = array.map(iterator);
    return Promise.all(promises);
}

/**
 * The same as  map , only the  iterator  is applied to each item in  array  in series.
 * The next  iterator  is only called once the current one has completed.
 * The results array will be in the same order as the original.
 */
export function mapSeries<T, U>(array: T[], iterator: PromiseListIterator<T, U>): Promise<U[]> {
    const results: U[] = [];

    return eachSeries(array, mapper).then(() => results);

    function mapper(item: T, index: number): Promise<void> {
        return ensure(iterator(item, index, array)).then(result => {
            results[index] = result;
        });
    }
}


/**
 * Returns a new array of all the values in `array` which pass an async truth test.
 * The Promise returned by each `iterator` call can only returns `boolean` value!
 * This operation is performed in parallel, but the results array will be in the same order as the original.
 */
export function filter<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T[]> {
    const results: T[] = [];

    return Promise.all(array.map(filterr)).then(() => results);

    function filterr(value: T, index: number, list: T[]): Promise<void> {
        return ensure(iterator(value, index, list)).then(include => {
            if (include) results.push(value);
        });
    }
}

/**
 * The same as `filter` only the `iterator` is applied to each item in `array` in series.
 * The next `iterator` is only called once the current one has completed.
 * The results array will be in the same order as the original.
 */
export function filterSeries<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T[]> {
    const results: T[] = [];

    return eachSeries(array, filterr).then(() => results);

    function filterr(item: T, index: number): Promise<void> {
        return ensure(iterator(item, index, array)).then(include => {
            if (include) results.push(item);
        });
    }
}


/**
 * The opposite of `filter`. Removes values that pass an `async` truth test.
 */
export function reject<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T[]> {
    const results: T[] = [];

    return Promise.all(array.map(rejecter)).then(() => results);

    function rejecter(item: T, index: number, list: T[]): Promise<void> {
        return ensure(iterator(item, index, list)).then(include => {
            if (!include) results.push(item);
        });
    }
}

/**
 * The same as `reject`, only the `iterator` is applied to each item in `array` in series.
 */
export function rejectSeries<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T[]> {
    const results: T[] = [];

    return eachSeries(array, rejecter).then(() => results);

    function rejecter(item: T, index: number, list: T[]): Promise<void> {
        return ensure(iterator(item, index, list)).then(include => {
            if (!include) results.push(item);
        });
    }
}

/**
 * Reduces `array` into a single value using an async `iterator` to return each successive step.
 * `memo` is the initial state of the reduction.
 * This function only operates in series.
 * 
 * For performance reasons, it may make sense to split a call to this function into a parallel map, 
 * and then use the normal `Array.prototype.reduce` on the results. 
 * 
 * This function is for situations where each step in the reduction needs to be async; 
 * if you can get the data before reducing it, then it's probably a good idea to do so.
 */
export function reduce<T, U>(array: T[], memo: U, iterator: PromiseReduceIterator<T, U>): Promise<U> {
    return eachSeries(array, reducer).then(() => memo);

    function reducer(item: T): Promise<void> {
        return ensure(iterator(memo, item)).then(result => {
            memo = result;
        });
    }
}

/**
 * Same as `reduce`, only operates on `array` in reverse order.
 */
export function reduceRight<T, U>(array: T[], memo: U, iterator: PromiseReduceIterator<T, U>): Promise<U> {
    const clone = [...array].reverse();
    return reduce(clone, memo, iterator);
}


/**
 * Returns the first value in `array` that passes an async truth test.
 * The  iterator  is applied in parallel, meaning the first iterator to return `true` resolve the global `find` Promise. 
 * That means the result might not be the first item in the original  array  (in terms of order) that passes the test.
 * If order within the original `array` is important, then look at `findSeries`.
 */
export function find<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T | undefined> {
    const len = array.length;
    let count = 0;

    return new Promise<T | undefined>((resolve, reject) => {
        array.forEach(finder);

        function finder(value: T, index: number, list: T[]): Promise<void> {
            return ensure(iterator(value, index, list)).then(valid => {
                if (valid || ++count === len) {
                    resolve(value);
                }
            }, reject);
        }
    });

}

/**
 * The same as `find`, only the `iterator` is applied to each item in `array` in series.
 * This means the result is always the first in the original `array` (in terms of array order) that passes the truth test.
 */
export function findSeries<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T | undefined> {
    const last = array.length - 1;

    return recurse();

    function recurse(index = 0): Promise<T | undefined> {
        const value = array[index];

        return ensure(iterator(value, index, array))
            .then(valid => {
                if (valid) { return value; }

                if (index < last) {
                    return recurse(index + 1);
                }
            });
    }
}


/**
 * Sorts a list by the results of running each `array` value through an async `iterator`.
 */
export function sortBy<T, U>(array: T[], iterator: PromiseListIterator<T, U>): Promise<T[]> {
    return map(array, sortMapper).then(result => result.sort(sortFunction).map(i => i.source));

    function sortMapper(item: T, index: number): Promise<SortItem<T, U>> {
        return ensure(iterator(item, index, array))
            .then(res => ({ source: item, result: res }));
    }

    function sortFunction(left: SortItem<T, U>, right: SortItem<T, U>): number {
        const a = left.result, b = right.result;
        return a < b ? -1 : a > b ? 1 : 0;
    }
}

interface SortItem<T, U> {
    source: T;
    result: U;
}


/**
 * Returns `true` if at least one element in the `array` satisfies an async test.
 * The `Promise` returned by each `iterator` call can only returns boolean value!
 * Once any iterator call returns `true`, the main `Promise` is resolved.
 */
export function some<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<boolean> {
    return find(array, iterator).then(result => !!result);
}

/**
 * Returns `true` if every element in  array  satisfies an async test.
 */
export function every<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<boolean> {
    return find(array, iterator).then(result => !result);
}


/**
 * Applies `iterator` to each item in `array`, concatenating the results.
 * Returns the concatenated list. 
 * 
 * The `iterator`s are called in parallel, and the results are concatenated as they return.
 * There is no guarantee that the results array will be returned in the original order of `array` passed to the `iterator` function.
 */
export function concat<T, U>(array: T[], iterator: PromiseListIterator<T, U[]>): Promise<U[]> {
    return map(array, iterator)
        .then(results => Array.prototype.concat.apply([], results.filter(a => !!a)));
}

/**
 * Same as `concat`, but executes in series instead of parallel.
 */
export function concatSeries<T, U>(array: T[], iterator: PromiseListIterator<T, U[]>): Promise<U[]> {
    return mapSeries(array, iterator)
        .then(results => Array.prototype.concat.apply([], results.filter(a => !!a)));
}
