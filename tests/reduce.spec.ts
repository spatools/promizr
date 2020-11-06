import reduce from "../lib/reduce";

import timeout from "./helpers/timeout";

const LIST = [15, 1, 8];

const REDUCE_TOTAL = LIST[0] + LIST[1] + LIST[2] + 1;
const REDUCE_RESULT = 1;

describe("promizr.reduce()", () => {

    test("should return reduced value using iterator", async () => {
        const spy = jest.fn((a, b) => a - b);

        const result = await reduce(LIST, REDUCE_TOTAL, (a, b) => timeout(b).then(() => spy(a, b)));

        expect(spy).toHaveBeenCalledTimes(3);

        expect(result).toBe(REDUCE_RESULT);
    });

    test("should call each provided methods with given values in series", async () => {
        const spy = jest.fn((a, b, i, l) => a - b);

        await reduce(LIST, REDUCE_TOTAL, (a, b, i, l) => timeout(b).then(() => spy(a, b, i, l)));

        expect(spy).toHaveBeenCalledTimes(3);

        expect(spy).toHaveBeenNthCalledWith(1, REDUCE_TOTAL, LIST[0], 0, LIST);
        expect(spy).toHaveBeenNthCalledWith(2, REDUCE_TOTAL - LIST[0], LIST[1], 1, LIST);
        expect(spy).toHaveBeenNthCalledWith(3, REDUCE_TOTAL - LIST[0] - LIST[1], LIST[2], 2, LIST);
    });

    test("should reject if an iterator throws", async () => {
        const spy = jest.fn();
        const err = new Error("test");

        spy.mockResolvedValueOnce(1);
        spy.mockRejectedValueOnce(err);
        spy.mockResolvedValueOnce(2);

        await expect(reduce(LIST, REDUCE_TOTAL, spy))
            .rejects.toBe(err);
    });

    test("should stop if an iterator throws", async () => {
        const spy = jest.fn((a, b) => a - b);
        const err = new Error("test");

        const iterator = jest.fn((a, b, i) => {
            return timeout(b).then(() => {
                if (i === 1) {
                    throw err;
                }

                return spy(a, b);
            });
        });

        await expect(reduce(LIST, REDUCE_TOTAL, iterator))
            .rejects.toBe(err);


        expect(spy).toBeCalledTimes(1);
        expect(spy).toBeCalledWith(REDUCE_TOTAL, LIST[0]);

        expect(iterator).toBeCalledTimes(2);
        expect(iterator).toHaveBeenNthCalledWith(1, REDUCE_TOTAL, LIST[0], 0, LIST);
        expect(iterator).toHaveBeenNthCalledWith(2, REDUCE_TOTAL - LIST[0], LIST[1], 1, LIST);
    });

});
