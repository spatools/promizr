import parallelLimit from "../lib/parallelLimit";
import QueueError from "../lib/QueueError";

import timeout from "./helpers/timeout";
import createExecutorObject from "./helpers/createExecutorObject";
import createDeferreds from "./helpers/createDeferreds";

const LIST = [15, 1, 8, 25, 5];
const LIMIT = 3;
const TOTAL = LIST.length;

const BIG_LIST = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

describe("promizr.parallelLimit()", () => {

    describe("with an array", () => {

        test("should returns a Promise which resolves when all tasks are done", async () => {
            const spies = LIST.map(n => jest.fn(() => timeout(n).then(() => n * n)));

            const promise = parallelLimit(spies, LIMIT);

            expect(promise).toEqual(expect.any(Promise));

            const res = await promise;

            for (const num of LIST) {
                expect(res).toContain(num * num);
            }

            for (const spy of spies) {
                expect(spy).toHaveBeenCalledTimes(1);
            }
        });

        test("should reject immediately if any item reject", async () => {
            const err = new Error("test");
            const spy = jest.fn(() => { throw err; });

            const tasks = LIST.map((n, i) => () => timeout(n).then(spy));

            await expect(parallelLimit(tasks, LIMIT))
                .rejects.toBe(err);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test("should wait to reject QueueError if waitToReject is set to true", async () => {
            const spy = jest.fn(n => n % 2 === 0 ? Promise.reject(new Error("test")) : Promise.resolve(n));
            const tasks = LIST.map((n) => () => timeout(1).then(() => spy(n)));

            await expect(parallelLimit(tasks, LIMIT, { waitToReject: true }))
                .rejects.toBeInstanceOf(QueueError);

            expect(spy).toHaveBeenCalledTimes(TOTAL);
        });

        test("should only launch specified limit number of task simultaneously", async () => {
            const spy = jest.fn(() => timeout(20));
            const tasks = LIST.map(() => spy);

            parallelLimit(tasks, LIMIT);

            await timeout(10);

            expect(spy).toHaveBeenCalledTimes(LIMIT);
        });

        test("should continue to limit number of task simultaneously when promises are resolved", async () => {
            const dfds = createDeferreds(BIG_LIST);

            const spy = jest.fn((n) => dfds[n].promise);
            const tasks = BIG_LIST.map((n) => () => spy(n));

            parallelLimit(tasks, LIMIT);

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

        test("should not continue to execute works if exception occurred", async () => {
            const err = new Error("This is an error !");
            const dfds = createDeferreds(BIG_LIST);

            const spy = jest.fn(n => dfds[n].promise);
            const tasks = BIG_LIST.map((n) => () => spy(n));

            const promise = parallelLimit(tasks, LIMIT);

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

        test("should continue to execute works even if exception occurred and stopOnError is false", async () => {
            const err = new Error("test");
            const spy = jest.fn(n => {
                return timeout(n).then(() => {
                    throw err;
                });
            });

            const tasks = BIG_LIST.map((n) => () => spy(n));

            await expect(parallelLimit(tasks, LIMIT, { stopOnError: false }))
                .rejects.toBe(err);

            expect(spy).toHaveBeenCalledTimes(LIMIT);

            await timeout(100);

            expect(spy).toHaveBeenCalledTimes(BIG_LIST.length);
        });

    });

    describe("with an object", () => {

        test("should returns a Promise which resolves when all tasks are done", async () => {
            const spy = jest.fn(n => async () => n * n);
            const obj = createExecutorObject(LIST, spy);

            const promise = parallelLimit(obj, LIMIT);

            expect(promise).toEqual(expect.any(Promise));

            const res = await promise;

            for (const num of LIST) {
                expect(res).toHaveProperty(`property-${num}`, num * num);
            }

            expect(spy).toHaveBeenCalledTimes(TOTAL);
        });

        test("should reject immediately if any item reject", async () => {
            const err = new Error("test");
            const spy = jest.fn<any, []>(() => { throw err; });

            const obj = createExecutorObject(LIST, (n) => () => timeout(n).then(spy));

            await expect(parallelLimit(obj, LIMIT))
                .rejects.toBe(err);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test("should wait to reject QueueError if waitToReject is set to true", async () => {
            const spy = jest.fn(n => n % 2 === 0 ? Promise.reject(new Error("test")) : Promise.resolve(n));
            const obj = createExecutorObject(LIST, (n) => () => timeout(1).then(() => spy(n)));

            await expect(parallelLimit(obj, LIMIT, { waitToReject: true }))
                .rejects.toBeInstanceOf(QueueError);

            expect(spy).toHaveBeenCalledTimes(TOTAL);
        });

        test("should only launch specified limit number of task simultaneously", async () => {
            const spy = jest.fn(() => timeout(20));
            const obj = createExecutorObject(LIST, () => spy);

            parallelLimit(obj, LIMIT);

            await timeout(10);

            expect(spy).toHaveBeenCalledTimes(LIMIT);
        });

        test("should continue to limit number of task simultaneously when promises are resolved", async () => {
            const dfds = createDeferreds(BIG_LIST);

            const spy = jest.fn((n) => dfds[n].promise);
            const obj = createExecutorObject(BIG_LIST, (n) => () => spy(n));

            parallelLimit(obj, LIMIT);

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

        test("should not continue to execute works if exception occurred", async () => {
            const err = new Error("This is an error !");
            const dfds = createDeferreds(BIG_LIST);

            const spy = jest.fn(n => dfds[n].promise);
            const obj = createExecutorObject(BIG_LIST, (n) => () => spy(n));

            const promise = parallelLimit(obj, LIMIT);

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

        test("should continue to execute works even if exception occurred and stopOnError is false", async () => {
            const err = new Error("test");
            const spy = jest.fn(n => {
                return timeout(n).then(() => {
                    throw err;
                });
            });

            const obj = createExecutorObject(BIG_LIST, (n) => () => spy(n));

            await expect(parallelLimit(obj, LIMIT, { stopOnError: false }))
                .rejects.toBe(err);

            expect(spy).toHaveBeenCalledTimes(LIMIT);

            await timeout(100);

            expect(spy).toHaveBeenCalledTimes(BIG_LIST.length);
        });

    });

});
