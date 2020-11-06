import concatSeries from "../lib/concatSeries";

import timeout from "./helpers/timeout";
import sort from "./helpers/sort";

const LIST = [15, 1, 8];
const STOP_LIST = [251, 1, 50];

describe("promizr.concatSeries()", () => {

    test("should call each provided methods with given values in parallel", async () => {
        const spy = jest.fn((num, i, l) => [num]);

        await concatSeries(LIST, (num, i, list) => timeout(num).then(() => spy(num, i, list)));

        expect(spy).toHaveBeenCalledTimes(3);

        for (let i = 0; i < LIST.length; i++) {
            expect(spy).toHaveBeenNthCalledWith(i + 1, LIST[i], i, LIST);
        }
    });

    test("should return flattened array with arrays returned by iterator", async () => {
        const spy = jest.fn(num => [num]);

        const results = await concatSeries(LIST, num => timeout(num).then(() => spy(num)));
        expect(spy).toHaveBeenCalledTimes(3);

        expect(results).toHaveLength(3);
        expect(results).toEqual(LIST);
    });

    test("should stop if an iterator throws", async () => {
        const spy = jest.fn(num => [num]);
        const err = new Error("test");

        const iterator = jest.fn(num => {
            return timeout(num).then(() => {
                if (num === STOP_LIST[1]) {
                    throw err;
                }

                return spy(num);
            });
        });

        await expect(concatSeries(STOP_LIST, iterator))
            .rejects.toBe(err);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(STOP_LIST[0]);

        expect(iterator).toHaveBeenCalledTimes(2);
        expect(iterator).toHaveBeenNthCalledWith(1, STOP_LIST[0], 0, STOP_LIST);
        expect(iterator).toHaveBeenNthCalledWith(2, STOP_LIST[1], 1, STOP_LIST);
    });

});
