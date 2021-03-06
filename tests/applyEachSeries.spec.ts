import applyEachSeries from "../lib/applyEachSeries";

import timeout from "./helpers/timeout";

const LIST = [15, 1, 8];
const STOP_LIST = [251, 1, 50];

describe("promizr.applyEachSeries()", () => {

    test("should return a promised function which should transfer its arguments to all tasks", async () => {
        const spy = jest.fn((...args) => timeout(1));
        const executors = [spy, spy, spy];
        const owner = {};

        const fn = applyEachSeries(executors);

        expect(spy).not.toHaveBeenCalled();

        await fn.apply(owner, LIST);

        expect(spy).toHaveBeenCalledTimes(3);

        expect(spy).toHaveBeenNthCalledWith(1, LIST[0], LIST[1], LIST[2]);
        expect(spy).toHaveBeenNthCalledWith(2, LIST[0], LIST[1], LIST[2]);
        expect(spy).toHaveBeenNthCalledWith(3, LIST[0], LIST[1], LIST[2]);
        // sinon.assert.alwaysCalledOn(spy, owner);
    });

    test("should call each provided methods with given arguments in series", async () => {
        const spy = jest.fn();
        const executors = LIST.map(num => (arg: number[]) => timeout(num).then(() => spy(num, arg)));

        await applyEachSeries(executors)(LIST);
        expect(spy).toHaveBeenCalledTimes(3);

        for (let i = 0; i < LIST.length; i++) {
            expect(spy).toHaveBeenNthCalledWith(i + 1, LIST[i], LIST);
        }
    });

    test("should return an array with each values returned by executors", async () => {
        const spy = jest.fn(num => num * num),
            executors = LIST.map(num => () => timeout(num).then(() => spy(num)));

        const results = await applyEachSeries(executors)();
        expect(spy).toHaveBeenCalledTimes(3);

        expect(results).toHaveLength(3);
        expect(results[0]).toBe(LIST[0] * LIST[0]);
        expect(results[1]).toBe(LIST[1] * LIST[1]);
        expect(results[2]).toBe(LIST[2] * LIST[2]);

    });

    test("should stop if an executor throws", async () => {
        const spy = jest.fn();
        const err = new Error("test");

        const executors = STOP_LIST.map(num => jest.fn(() => {
            return timeout(num).then(() => {
                if (num === STOP_LIST[1]) {
                    throw err;
                }

                spy(num);
            });
        }));

        await expect(applyEachSeries(executors)())
            .rejects.toBe(err);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(STOP_LIST[0]);

        expect(executors[0]).toHaveBeenCalledTimes(1);
        expect(executors[1]).toHaveBeenCalledTimes(1);
        expect(executors[2]).not.toHaveBeenCalled();

    });

});
