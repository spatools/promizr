import eachLimit from "../lib/eachLimit";
import QueueError from "../lib/QueueError";
import createDeferreds from "./helpers/createDeferreds";

import timeout from "./helpers/timeout";

const LIST = [15, 1, 8, 25, 5];
const LIMIT = 3;
const TOTAL = LIST.length;

const BIG_LIST = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

describe("promizr.eachLimit()", () => {

    test("should returns a Promise which resolves when all tasks are done", async () => {
        const spy = jest.fn((n, i, l) => timeout(n));

        const promise = eachLimit(LIST, LIMIT, spy);

        expect(promise).toEqual(expect.any(Promise));

        await expect(promise)
            .resolves.toBeUndefined();

        expect(spy).toHaveBeenCalledTimes(TOTAL);

        for (let i = 0; i < TOTAL; i++) {
            expect(spy).toHaveBeenCalledWith(LIST[i], i, LIST);
        }
    });

    test("should reject immediately if any item reject", async () => {
        const err = new Error("test");
        const spy = jest.fn(() => { throw err; });

        await expect(eachLimit(LIST, LIMIT, () => timeout(1).then(spy)))
            .rejects.toBe(err);

        expect(spy).toHaveBeenCalledTimes(1);
    });

    test("should wait to reject QueueError if waitToReject is set to true", async () => {
        const spy = jest.fn(n => n % 2 === 0 ? Promise.reject(new Error("test")) : Promise.resolve(n));

        const iterator = (n: number) => timeout(1).then(() => spy(n));

        await expect(eachLimit(LIST, LIMIT, iterator, { waitToReject: true }))
            .rejects.toBeInstanceOf(QueueError);

        expect(spy).toHaveBeenCalledTimes(TOTAL);
    });

    test("should only launch specified limit number of task simultaneously", async () => {
        const spy = jest.fn(() => timeout(20));

        eachLimit(LIST, LIMIT, spy);

        await timeout(10);

        expect(spy).toHaveBeenCalledTimes(LIMIT);
    });

    test("should continue to limit number of task simultaneously when promises are resolved", async () => {
        const dfds = createDeferreds(BIG_LIST)
        const spy = jest.fn((n) => dfds[n].promise);

        eachLimit(BIG_LIST, LIMIT, spy);

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
        const dfds = createDeferreds(BIG_LIST)
        const spy = jest.fn(n => dfds[n].promise);

        const promise = eachLimit(BIG_LIST, LIMIT, spy);

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

        await expect(eachLimit(BIG_LIST, LIMIT, spy, { stopOnError: false }))
            .rejects.toBe(err);

        expect(spy).toHaveBeenCalledTimes(LIMIT);

        await timeout(100);

        expect(spy).toHaveBeenCalledTimes(BIG_LIST.length);
    });

});
