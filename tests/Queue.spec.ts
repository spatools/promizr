import Queue from "../lib/Queue";
import QueueError from "../lib/QueueError";

import timeout from "./helpers/timeout";
import createDeferreds from "./helpers/createDeferreds";

const LIST = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const TOTAL = LIST.length;
const LIMIT = 3;

describe("promizr.Queue", () => {

    describe(".constructor()", () => {

        test("should not start queue if no list provided", async () => {
            const spy = jest.fn();

            new Queue(spy);

            await timeout(10);

            expect(spy).not.toHaveBeenCalled();
        });

        test("should assign options to instance", async () => {
            const instance = new Queue(i => i, LIMIT, {
                stopOnError: true,
                waitToReject: true
            });

            expect(instance).toHaveProperty("stopOnError", true);
            expect(instance).toHaveProperty("waitToReject", true);
        });

    });

    describe(".push()", () => {

        test("should returns a Promise which resolves when all tasks are done", async () => {
            const spy = jest.fn(() => timeout(10));
            const instance = new Queue(spy, LIMIT);

            const promise = instance.push(LIST);
            expect(promise).toEqual(expect.any(Promise));

            await expect(promise)
                .resolves.toEqual(expect.any(Array));

            expect(spy).toHaveBeenCalledTimes(TOTAL);
        });

        test("should resolves instantly if no items are passed", async () => {
            const spy = jest.fn(() => timeout(10));
            const instance = new Queue(spy, LIMIT);

            await instance.push();

            expect(spy).toHaveBeenCalledTimes(0);
        });

        test("should resolve with an array containing results of each workers", async () => {
            const instance = new Queue(i => i, LIMIT);

            const res = await instance.push(LIST);

            expect(res).toEqual(LIST);
            expect(res).not.toBe(LIST);
        });

        test("should resolve with only one item if only one item is passed to pushed function", async () => {
            const instance = new Queue(i => i, LIMIT);

            const res = await instance.push(LIST[0]);
            expect(res).toBe(LIST[0]);
        });

        test("should reject immediately if any item reject", async () => {
            const spy = jest.fn(n => Promise.reject(n));
            const instance = new Queue((n: number) => timeout(n * 10).then(() => spy(n)), LIMIT);

            await expect(instance.push(LIST))
                .rejects.toBe(LIST[0]);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test("should wait to reject QueueError if waitToReject is set to true", async () => {
            const spy = jest.fn(n => n % 2 === 0 ? Promise.reject(n) : Promise.resolve(n));
            const instance = new Queue((n: number) => timeout(n).then(() => spy(n)), LIMIT, { waitToReject: true });

            await expect(instance.push(LIST))
                .rejects.toBeInstanceOf(QueueError);

            await expect(instance.push(LIST))
                .rejects.toHaveProperty("innerErrors", LIST.filter(n => n % 2 === 0));

            await expect(instance.push(LIST))
                .rejects.toHaveProperty("results", LIST.filter(n => n % 2 === 1));
        });

        test("should call onsaturated if there are more items than limit", () => {
            const spy = jest.fn();
            const instance = new Queue(n => n, LIMIT, { onsaturated: spy });

            instance.push(LIST.slice(0, 2));

            expect(spy).not.toHaveBeenCalled();

            instance.push(LIST.slice(3));

            expect(spy).toHaveBeenCalledTimes(1);

            instance.push(LIST);

            expect(spy).toHaveBeenCalledTimes(2);
        });

    });

    describe(".unshift()", () => {

        test("returns a Promise which resolves when all tasks are done", async () => {
            const spy = jest.fn(() => timeout(10));
            const instance = new Queue(spy, LIMIT);

            const promise = instance.unshift(LIST);
            expect(promise).toEqual(expect.any(Promise));

            await expect(promise)
                .resolves.toEqual(expect.any(Array));

            expect(spy).toHaveBeenCalledTimes(TOTAL);
        });

        test("should resolve with an array containing results of each workers", async () => {
            const instance = new Queue(i => i, LIMIT);

            const res = await instance.unshift(LIST);

            expect(res).toEqual(LIST);
            expect(res).not.toBe(LIST);
        });

        test("should resolve with only one item if only one item is passed to unshift function", async () => {
            const instance = new Queue(i => i, LIMIT);

            const res = await instance.unshift(LIST[0]);
            expect(res).toBe(LIST[0]);
        });

        test("should resolve before push", async () => {
            const pushDfds = createDeferreds(LIST);
            const unshiftDfds = createDeferreds(LIST);

            const spy = jest.fn(n => {
                const dfds = n > TOTAL ? pushDfds : unshiftDfds;
                return dfds[n % TOTAL].promise.then(() => n);
            });

            const instance = new Queue(spy, LIMIT);
            const pushPromise = instance.push(LIST.map(n => n + TOTAL));
            const unshiftPromise = instance.unshift(LIST);

            for (let i = 0, len = TOTAL; i < len; i++) {
                unshiftDfds[i].resolve();
            }

            for (let i = 0, len = TOTAL; i < len; i++) {
                pushDfds[i].resolve();
            }

            await unshiftPromise;

            expect(spy).not.toHaveBeenCalledTimes(TOTAL * 2);

            await pushPromise;

            expect(spy).toHaveBeenCalledTimes(TOTAL * 2);
        });

    });

    describe(".pause()", () => {

        test("should stop launching task while in pause", async () => {
            const dfds = createDeferreds(LIST)
            const spy = jest.fn(n => dfds[n].promise);

            const instance = new Queue(spy, LIMIT);
            instance.push(LIST);

            await timeout(10);

            expect(spy).toHaveBeenCalledTimes(LIMIT);

            for (let i = 0, len = LIMIT; i < len; i++) {
                dfds[i].resolve();
            }

            await dfds[LIMIT - 1].promise;
            await timeout(10);

            expect(spy).toHaveBeenCalledTimes(LIMIT * 2);

            instance.pause();

            for (let i = LIMIT, len = LIMIT * 3; i < len; i++) {
                dfds[i].resolve();
            }

            await dfds[LIMIT * 2 - 1].promise;
            await timeout(10);

            expect(spy).toHaveBeenCalledTimes(LIMIT * 2);

        });

    });

    describe(".resume()", () => {

        test("should resume launching task", async () => {
            const dfds = createDeferreds(LIST)
            const spy = jest.fn(n => dfds[n].promise);

            const instance = new Queue(spy, LIMIT);
            instance.push(LIST);

            await timeout(10);

            expect(spy).toHaveBeenCalledTimes(LIMIT);

            for (let i = 0, len = LIMIT; i < len; i++) {
                dfds[i].resolve();
            }

            await dfds[LIMIT - 1].promise;
            await timeout(10);

            expect(spy).toHaveBeenCalledTimes(LIMIT * 2);

            instance.pause();

            for (let i = LIMIT, len = LIMIT * 3; i < len; i++) {
                dfds[i].resolve();
            }

            await dfds[LIMIT * 2 - 1].promise;
            await timeout(10);

            expect(spy).toHaveBeenCalledTimes(LIMIT * 2);

            instance.resume();

            await timeout(10);

            expect(spy).toHaveBeenCalledTimes(LIMIT * 4);
        });

    });

    describe(".clear()", () => {

        test("should remove all tasks from queue", async () => {
            const dfds = createDeferreds(LIST)
            const spy = jest.fn(n => dfds[n].promise);

            const instance = new Queue(spy, LIMIT);
            instance.push(LIST);

            await timeout(10);

            expect(spy).toHaveBeenCalledTimes(LIMIT);

            for (let i = 0, len = LIMIT; i < len; i++) {
                dfds[i].resolve();
            }

            await dfds[LIMIT - 1].promise;
            await timeout(10);

            expect(spy).toHaveBeenCalledTimes(LIMIT * 2);

            instance.clear();

            for (let i = LIMIT, len = LIMIT * 3; i < len; i++) {
                dfds[i].resolve();
            }

            await dfds[LIMIT * 2 - 1].promise;
            await timeout(10);

            expect(spy).toHaveBeenCalledTimes(LIMIT * 2);

            expect(instance).toHaveProperty("length", 0);

        });

    });

    describe(".length", () => {

        test("should returns items length", () => {
            const dfds = createDeferreds(LIST);
            const spy = jest.fn(n => dfds[n].promise);

            const instance = new Queue(spy, LIMIT);

            expect(instance).toHaveProperty("length", 0);

            instance.push(LIST);

            expect(instance).toHaveProperty("length", TOTAL);

            instance.push(LIST);

            expect(instance).toHaveProperty("length", TOTAL * 2);
        });

    });

    describe(".running", () => {

        test("should returns true if some workers are running", async () => {
            const dfds = createDeferreds(LIST);
            const spy = jest.fn(n => dfds[n].promise);

            const instance = new Queue(spy, LIMIT);

            expect(instance).toHaveProperty("running", false);

            const promise = instance.push(LIST);

            expect(instance).toHaveProperty("running", true);

            for (let i = 0; i < TOTAL; i++) {
                dfds[i].resolve();
            }

            await promise;

            expect(instance).toHaveProperty("running", false);
        });

    });

    describe(".idle", () => {

        test("should returns true when empty", async () => {
            const dfds = createDeferreds(LIST);
            const spy = jest.fn(n => dfds[n].promise);

            const instance = new Queue(spy, LIMIT);

            expect(instance).toHaveProperty("idle", true);

            const promise = instance.push(LIST);

            expect(instance).toHaveProperty("idle", false);

            for (let i = 0; i < TOTAL; i++) {
                dfds[i].resolve();
            }

            await promise;

            expect(instance).toHaveProperty("idle", true);
        });

    });

    describe("#process()", () => {

        test("should only launch specified limit number of task simultaneously", async () => {
            const spy = jest.fn(() => timeout(20));

            const instance = new Queue(spy, LIMIT);
            instance.push(LIST);

            await timeout(10);

            expect(spy).toHaveBeenCalledTimes(LIMIT);
        });

        test("should continue to limit number of task simultaneously when promises are resolved", async () => {
            const dfds = createDeferreds(LIST)
            const spy = jest.fn(n => dfds[n].promise);

            const instance = new Queue(spy, LIMIT);
            instance.push(LIST);

            expect(spy).not.toHaveBeenCalled();

            await timeout(10);

            expect(spy).toHaveBeenCalledTimes(LIMIT);

            for (let i = 0, len = LIMIT; i < len; i++) {
                dfds[i].resolve();
            }

            await dfds[LIMIT - 1].promise;
            await timeout(10);

            expect(spy).toHaveBeenCalledTimes(LIMIT * 2);

            for (let i = LIMIT, len = LIMIT * 3; i < len; i++) {
                dfds[i].resolve();
            }

            await dfds[LIMIT * 2 - 1].promise;
            await timeout(10);

            expect(spy).toHaveBeenCalledTimes(LIMIT * 4);
        });

        test("should continue to execute works even if exception occurred", async () => {
            const err = new Error("test");

            const spy = jest.fn(n => {
                return timeout(n).then(() => {
                    throw err;
                });
            });

            const instance = new Queue(spy, LIMIT);
            await expect(instance.push(LIST))
                .rejects.toBe(err);

            expect(spy).toHaveBeenCalledTimes(LIMIT);

            await timeout(100);

            expect(spy).toHaveBeenCalledTimes(TOTAL);
        });

        test("should not continue to execute works if exception occurred and stopOnError is set to true", async () => {
            const err = new Error("This is an error !");
            const dfds = createDeferreds(LIST)
            const spy = jest.fn(n => dfds[n].promise);

            const instance = new Queue(spy, LIMIT, { stopOnError: true });
            const promise = instance.push(LIST);

            expect(spy).not.toHaveBeenCalled();

            await timeout(10);

            expect(spy).toHaveBeenCalledTimes(LIMIT);

            for (let i = 0, len = LIMIT; i < len; i++) {
                dfds[i].reject(err);
            }

            await expect(promise)
                .rejects.toBe(err);

            expect(spy).toHaveBeenCalledTimes(LIMIT);
        });

        test("should call onempty when queue has no more items", async () => {
            const spy = jest.fn();
            const instance = new Queue(n => n, LIMIT, { onempty: spy });

            const promise = instance.push(LIST);

            expect(spy).not.toHaveBeenCalled();

            await promise;

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test("should call onempty when queue has no more items nor workers", async () => {
            const spy = jest.fn();
            const instance = new Queue(n => n, LIMIT, { ondrain: spy });

            const promise = instance.push(LIST);

            expect(spy).not.toHaveBeenCalled();

            await promise;

            expect(spy).toHaveBeenCalledTimes(1);
        });

    });

});
