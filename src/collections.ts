/// <reference path="base.d.ts" />

export function each<T>(array: T[], iterator: PromiseListIterator<T, any>): Promise<void> {
    var promises = array.map(iterator);
    return Promise.all(promises).then(() => { return; });
}

export function eachSeries<T>(array: T[], iterator: PromiseListIterator<T, any>): Promise<void> {
    var p = Promise.resolve(),
        i = 0, len = array.length;

    for (; i < len; i++) {
        p = p.then(iterator.bind(null, array[i], i, array));
    }

    return p.then(() => { return; });
}


export function map<T, U>(array: T[], iterator: PromiseListIterator<T, U>): Promise<U[]> {
    var promises = array.map(iterator);
    return Promise.all(promises);
}

export function mapSeries<T, U>(array: T[], iterator: PromiseListIterator<T, U>): Promise<U[]> {
    var results: U[] = [];

    function mapper(item: T, index: number): Promise<void> {
        return iterator(item, index, array).then(result => {
            results[index] = result;
        });
    }

    return eachSeries(array, mapper).then(() => results);
}


export function filter<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T[]> {
    var results: T[] = [],

        promises = array.map((value, index, list) => iterator(value, index, list).then(include => {
            if (include) {
                results.push(value);
            }
        }));

    return Promise.all(promises).then(() => results);
}

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


export function reject<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T[]> {
    var results: T[] = [],

        promises = array.map((value, index, list) => iterator(value, index, list).then(exclude => {
            if (!exclude) {
                results.push(value);
            }
        }));

    return Promise.all(promises).then(() => results);
}

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


export function reduce<T>(array: T[], memo: T, iterator: PromiseReduceIterator<T>): Promise<T> {
    function reducer(item: T, index: number): Promise<void> {
        return iterator(memo, item).then(result => {
            memo = result;
        });
    }

    return eachSeries(array, reducer).then(() => memo);
}

export function reduceRight<T>(array: T[], memo: T, iterator: PromiseReduceIterator<T>): Promise<T> {
    var clone = [].concat(array);
    clone.reverse();

    return reduce(array, memo, iterator);
}


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
        .catch<T>(err => {
            if (err !== "PROMIZR_NOTFOUND") {
                throw err;
            }

            return null;
        })
        .then(result => {
            while (resolvers.length) {
                resolvers.pop().call(null);
            }

            return result;
        });
}

export function findSeries<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<T> {
    var results: T[] = [];

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


export function some<T>(array: T[], iterator: PromiseListIterator<T, boolean>): Promise<boolean> {
    return find(array, iterator).then(result => !!result);
}

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
            if (err !== "PROMIZR_NOTOK") {
                throw err;
            }

            return false;
        });
}


export function concat<T, U>(array: T[], iterator: PromiseListIterator<T, U[]>): Promise<U[]> {
    return map(array, iterator)
        .then(results => Array.prototype.concat.apply([], results.filter(a => !!a)));
}

export function concatSeries<T, U>(array: T[], iterator: PromiseListIterator<T, U[]>): Promise<U[]> {
    return mapSeries(array, iterator)
        .then(results => Array.prototype.concat.apply([], results.filter(a => !!a)));
}
