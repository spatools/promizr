import findSeries from "../lib/findSeries";

import timeout from "./helpers/timeout";

const LIST = [15, 1, 8];

describe("promizr.findSeries()", () => {

    test("should return first found result filtered by iterator", async () => {
        const spy = jest.fn(num => num % 2 === 1);

        const result = await findSeries(LIST, num => timeout(num).then(() => spy(num)));

        expect(result).toBe(LIST[0]);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    test("should call each provided methods with given values in series", async () => {
        const spy = jest.fn((...args) => false);

        await findSeries(LIST, (num, i, list) => timeout(num).then(() => spy(num, i, list)));

        expect(spy).toHaveBeenCalledTimes(3);

        for (let i = 0; i < LIST.length; i++) {
            expect(spy).toHaveBeenNthCalledWith(i + 1, LIST[i], i, LIST);
        }
    });

    test("should return undefined if no result found", async () => {
        const spy = jest.fn(num => false);

        const result = await findSeries(LIST, num => timeout(num).then(() => spy(num)))

        expect(spy).toHaveBeenCalledTimes(3);

        expect(result).toBeUndefined();
    });

    test("should stop if an item is found", async () => {
        const spy = jest.fn(num => num % 2 === 1);
        const iterator = jest.fn(num => timeout(num).then(() => spy(num)));

        await findSeries(LIST, iterator);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(LIST[0]);

        expect(iterator).toHaveBeenCalledTimes(1)
        expect(iterator).toHaveBeenNthCalledWith(1, LIST[0], 0, LIST);
    });

    test("should reject if an iterator throws", async () => {
        const spy = jest.fn();
        const err = new Error("test");

        spy.mockResolvedValueOnce(false);
        spy.mockRejectedValueOnce(err);
        spy.mockResolvedValueOnce(false);

        await expect(findSeries(LIST, spy))
            .rejects.toBe(err);
    });

    test("should stop if an iterator throws", async () => {
        const spy = jest.fn(num => false);
        const err = new Error("test");

        const iterator = jest.fn(num => {
            return timeout(num).then(() => {
                if (num === LIST[1]) {
                    throw err;
                }

                return spy(num);
            });
        });

        await expect(findSeries(LIST, iterator))
            .rejects.toBe(err);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(LIST[0]);

        expect(iterator).toHaveBeenCalledTimes(2)
        expect(iterator).toHaveBeenNthCalledWith(1, LIST[0], 0, LIST);
        expect(iterator).toHaveBeenNthCalledWith(2, LIST[1], 1, LIST);
    });

});
