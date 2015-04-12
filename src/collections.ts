/// <reference path="../_definitions.d.ts" />

/** A function that return a Promise */
export interface PromiseTaskExecutor<T> {
    (): Promise<T>
    (...args: any[]): Promise<T>
}

/** Base List Iterator for promizr */
export interface PromiseListIterator<T, U> {
    (item: T, index: number, list: T[]): Promise<U>;
}

/** Iterator for promizr.reduce */
export interface PromiseReduceIterator<T> {
    (memo: T, item: T): Promise<T>;
}

/**
 * Applies the function  iterator  to each item in  arr , in parallel.
 * The  iterator  is called with an item from the list, the index of this item and the list itself.
 * If the  iterator  emit a rejected Promise, the each function Promise result is instantly rejected.
 * 
 * Note, that since this function applies  iterator  to each item in parallel, there is no guarantee that the iterator functions will complete in order.
 */
export function each<T>(array: T[], iterator: PromiseListIterator<T, any>): Promise<void> {
    var promises = array.map(iterator);
    return Promise.all(promises).then(() => { return; });
}

/**
 * The same as  each , only  iterator  is applied to each item in  array  in series.
 * The next  iterator  is only called once the current one has completed.
 * This means the  iterator  functions will complete in order.
 */
export function eachSeries<T>(array: T[], iterator: PromiseListIterator<T, any>): Promise<void> {
    return new Promise<void>((resolve: any, reject) => {
        var p = Promise.resolve(),
            i = 0, len = array.length;

        function partial(value: T, index: number): () => Promise<any> {
            return () => iterator(value, index, array);
        }

        for (; i < len; i++) {
            p = p.then(partial(array[i], i));
        }

        return p.then(() => resolve(), reject);
    });
}


/**
 * Produces a new array of values by mapping each value in  array  through the  iterator  function.
 * The  iterator  is called with an item from the list, the index of this item and the list itself.
 * If the  iterator  emit a rejected Promise, the each function Promise result is instantly rejected.
 * 
 * Note, that since this function applies the  iterator  to each item in parallel, there is no guarantee that the  iterator  functions will complete in order.
 * However, the results array will be in the same order as the original  arr .
 */
export function map<T, U>(array: T[], iterator: PromiseListIterator<T, U>): Promise<U[]> {
    var promises = array.map(iterator);
    return Promise.all(promises);
}

/**
 * The same as  map , only the  iterator  is applied to each item in  array  in series.
 * The next  iterator  is only called once the current one has completed.
 * The results array will be in the same order as the original.
 */
export function mapSeries<T, U>(array: T[], iterator: PromiseListIterator<T, U>): Promise<U[]> {
    var results: U[] = [];

    function mapper(item: T, index: number): Promise<void> {
        return iterator(item, index, array).then(result => {
            results[index] = result;
        });
    }

    return eachSeries(array, mapper).then(() => results);
}


/**
 * Returns a new array of all the values in  array  which pass an async truth test.
 * The Promise returned by each  iterator  call can only returns boolean value!
 * This operation is performed in parallel, but the results array will be in the same order as the original.
 */
export function filter<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T[]> {
    var results: T[] = [],

        promises = array.map((value, index, list) => iterator(value, index, list).then(include => {
            if (include) {
                results.push(value);
            }
        }));

    return Promise.all(promises).then(() => results);
}

/**
 * The same as  filter  only the  iterator  is applied to each item in  array  in series.
 * The next  iterator  is only called once the current one has completed.
 * The results array will be in the same order as the original.
 */
export function filterSeries<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T[]> {
    var results: T[] = [];

    function filterer(item: T, index: number): Promise<void> {
        return iterator(item, index, array).then(include => {
            if (include) {
                results.push(item);
            }
        });
    }

    return eachSeries(array, filterer).then(() => results);
}


/**
 * The opposite of  filter . Removes values that pass an  async  truth test.
 */
export function reject<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T[]> {
    var results: T[] = [],

        promises = array.map((value, index, list) => iterator(value, index, list).then(exclude => {
            if (!exclude) {
                results.push(value);
            }
        }));

    return Promise.all(promises).then(() => results);
}

/**
 * The same as  reject , only the  iterator  is applied to each item in  array  in series.
 */
export function rejectSeries<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T[]> {
    var results: T[] = [];

    function rejecter(item: T, index: number): Promise<void> {
        return iterator(item, index, array).then(exclude => {
            if (!exclude) {
                results.push(item);
            }
        });
    }

    return eachSeries(array, rejecter).then(() => results);
}


/**
 * Reduces  array  into a single value using an async  iterator  to return each successive step.
 * memo  is the initial state of the reduction.
 * This function only operates in series.
 * 
 * For performance reasons, it may make sense to split a call to this function into a parallel map, 
 * and then use the normal  Array.prototype.reduce  on the results. 
 * 
 * This function is for situations where each step in the reduction needs to be async; 
 * if you can get the data before reducing it, then it's probably a good idea to do so.
 */
export function reduce<T>(array: T[], memo: T, iterator: PromiseReduceIterator<T>): Promise<T> {
    function reducer(item: T, index: number): Promise<void> {
        return iterator(memo, item).then(result => {
            memo = result;
        });
    }

    return eachSeries(array, reducer).then(() => memo);
}

/**
 * Same as  reduce , only operates on  array  in reverse order.
 */
export function reduceRight<T>(array: T[], memo: T, iterator: PromiseReduceIterator<T>): Promise<T> {
    var clone = [].concat(array).reverse();
    return reduce(clone, memo, iterator);
}


/**
 * Returns the first value in  array  that passes an async truth test.
 * The  iterator  is applied in parallel, meaning the first iterator to return  true  resolve the global  find  Promise. 
 * That means the result might not be the first item in the original  array  (in terms of order) that passes the test.
 * If order within the original  array  is important, then look at  findSeries .
 */
export function find<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T> {
    var resolvers: PromiseResolveFunction<any>[] = [];
    var promises = array.map((value, index, list) => iterator(value, index, list).then(valid => {
        if (!valid) {
            return new Promise<T>((resolve, reject) => {
                if (resolvers.length === array.length - 1) {
                    reject("PROMIZR_NOTFOUND");
                }
                else {
                    resolvers.push(resolve);
                }
            });
        }

        return value;
    }));

    return Promise.race(promises)
        .catch<any>(err => {
            if (err !== "PROMIZR_NOTFOUND") {
                throw err;
            }
        })
        .then(result => {
            while (resolvers.length) {
                resolvers.pop().call(null);
            }

            return result;
        });
}

/**
 * The same as  find , only the  iterator  is applied to each item in  array  in series.
 * This means the result is always the first in the original  array  (in terms of array order) that passes the truth test.
 */
export function findSeries<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T> {
    function finder(item: T, index: number): Promise<void> {
        return iterator(item, index, array).then(ok => {
            if (ok) {
                return Promise.reject({ success: true, data: item });
            }
        });
    }

    return eachSeries(array, finder)
        .catch(err => {
            if (!err.success) {
                throw err;
            }

            return err.data;
        });
}


/**
 * Sorts a list by the results of running each  array  value through an async  iterator .
 */
export function sortBy<T, U>(array: T[], iterator: PromiseListIterator<T, U>): Promise<T[]> {
    function sortMapper(item: T, index: number) {
        return iterator(item, index, array).then(res => {
            return {
                source: item,
                result: res
            };
        });
    }
    function sortFunction(left, right) {
        var a = left.result, b = right.result;
        return a < b ? -1 : a > b ? 1 : 0;
    }

    return map(array, sortMapper).then(result => result.sort(sortFunction).map(i => i.source));
}


/**
 * Returns  true  if at least one element in the  array  satisfies an async test.
 * The Promise returned by each  iterator  call can only returns boolean value!
 * Once any iterator call returns  true , the main Promise is resolved.
 */
export function some<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<boolean> {
    return find(array, iterator).then(result => !!result);
}

/**
 * Returns  true  if every element in  array  satisfies an async test.
 */
export function every<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<boolean> {
    var results: T[] = [],

        promises = array.map((value, index, list) => iterator(value, index, list).then(ok => {
            if (!ok) {
                throw new Error("PROMIZR_NOTOK");
            }
        }));

    return Promise.all(promises)
        .then(() => true)
        .catch(err => {
            if (err.message !== "PROMIZR_NOTOK") {
                throw err;
            }

            return false;
        });
}


/**
 * Applies  iterator  to each item in  array , concatenating the results.
 * Returns the concatenated list. 
 * 
 * The  iterator s are called in parallel, and the results are concatenated as they return.
 * There is no guarantee that the results array will be returned in the original order of  array  passed to the  iterator  function.
 */
export function concat<T, U>(array: T[], iterator: PromiseListIterator<T, U[]>): Promise<U[]> {
    return map(array, iterator)
        .then(results => Array.prototype.concat.apply([], results.filter(a => !!a)));
}

/**
 * Same as  concat , but executes in series instead of parallel.
 */
export function concatSeries<T, U>(array: T[], iterator: PromiseListIterator<T, U[]>): Promise<U[]> {
    return mapSeries(array, iterator)
        .then(results => Array.prototype.concat.apply([], results.filter(a => !!a)));
}
