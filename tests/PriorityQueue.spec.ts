import PriorityQueue from "../lib/PriorityQueue";
import QueueError from "../lib/QueueError";

import immediate from "../lib/immediate";

import timeout from "./helpers/timeout";
import createDeferreds from "./helpers/createDeferreds";

const LIST = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const TOTAL = LIST.length;
const LIMIT = 3;

describe("promizr.PriorityQueue", () => {

    describe("constructor", () => {

        test("should not start queue if no list provided", async () => {
            const spy = jest.fn();
            const instance = new PriorityQueue(spy, LIMIT);

            await timeout(10);
            expect(spy).not.toHaveBeenCalled();
        });

        // test("should start queue if list provided", async () => {
        //     const spy = jest.fn();
        //     const instance = new PriorityQueue(spy, limit, list);

        //     await timeout(20);
        //         sinon.assert.callCount(spy, list.length);
        // });

        // test("should start queue asynchronously", () => {
        //     const spy = jest.fn();
        //     const instance = new PriorityQueue(spy, limit, list);

        //     expect(spy).not.toHaveBeenCalled();
        // });

    });

    describe(".push()", () => {

        test("returns a Promise which resolves when all tasks are done", async () => {
            const spy = jest.fn(() => timeout(10));
            const instance = new PriorityQueue(spy, LIMIT);

            const promise = instance.push(LIST);
            expect(promise).toEqual(expect.any(Promise));

            await expect(promise)
                .resolves.toEqual(expect.any(Array));

            expect(spy).toHaveBeenCalledTimes(TOTAL);
        });

        test("should resolve with an array containing results of each workers", async () => {
            const instance = new PriorityQueue(i => i, LIMIT);

            const res = await instance.push(LIST);

            expect(res).toEqual(LIST);
            expect(res).not.toBe(LIST);
        });

        test("should resolve with only one item if only one item is passed to pushed function", async () => {
            const instance = new PriorityQueue(i => i, LIMIT);

            const res = await instance.push(LIST[0]);
            expect(res).toBe(LIST[0]);
        });

        test("should reject immediately if any item reject", async () => {
            const spy = jest.fn(n => Promise.reject(n));
            const instance = new PriorityQueue(n => immediate().then(() => spy(n)), LIMIT);

            await expect(instance.push(LIST))
                .rejects.toBe(LIST[0]);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test("should wait to reject QueueError if waitToReject is set to true", async () => {
            const spy = jest.fn(n => n % 2 === 0 ? Promise.reject(n) : Promise.resolve(n));
            const instance = new PriorityQueue(n => immediate().then(() => spy(n)), LIMIT, { waitToReject: true });

            await expect(instance.push(LIST))
                .rejects.toBeInstanceOf(QueueError);

            await expect(instance.push(LIST))
                .rejects.toHaveProperty("innerErrors", LIST.filter(n => n % 2 === 0));

            await expect(instance.push(LIST))
                .rejects.toHaveProperty("results", LIST.filter(n => n % 2 === 1));
        });

    });

    describe("#process()", () => {

        test("should only launch specified limit number of task simultaneously", async () => {
            const spy = jest.fn(() => timeout(20));

            const instance = new PriorityQueue(spy, LIMIT);
            instance.push(LIST);

            await timeout(10);

            expect(spy).toHaveBeenCalledTimes(LIMIT);
        });

        test("should continue to limit number of task simultaneously when promises are resolved", async () => {
            const dfds = createDeferreds(LIST)
            const spy = jest.fn(n => dfds[n].promise);

            const instance = new PriorityQueue(spy, LIMIT);
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
            const dfds = createDeferreds(LIST)

            const spy = jest.fn(n => {
                return timeout(n).then(() => {
                    throw err;
                });
            });

            const instance = new PriorityQueue(spy, LIMIT);
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

            const instance = new PriorityQueue(spy, LIMIT, { stopOnError: true });
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

        describe("with priority", () => {

            test("call tasks in priority order", async () => {
                const firstSpy = jest.fn(() => {
                    expect(secondSpy).not.toHaveBeenCalled();
                    expect(thirdSpy).not.toHaveBeenCalled();
                });

                const secondSpy = jest.fn(() => {
                    expect(firstSpy).toHaveBeenCalled();
                    expect(thirdSpy).not.toHaveBeenCalled();
                });

                const thirdSpy = jest.fn(() => {
                    expect(firstSpy).toHaveBeenCalled();
                    expect(secondSpy).toHaveBeenCalled();
                });

                const instance = new PriorityQueue(immediate, LIMIT);

                await Promise.all([
                    instance.push(5, LIST).then(thirdSpy),
                    instance.push(1, LIST).then(firstSpy),
                    instance.push(3, LIST).then(secondSpy)
                ]);

                expect(firstSpy).toHaveBeenCalledTimes(1);
                expect(secondSpy).toHaveBeenCalledTimes(1);
                expect(thirdSpy).toHaveBeenCalledTimes(1);
            });

        });

    });

});