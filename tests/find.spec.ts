import find from "../lib/find";

import timeout from "./helpers/timeout";
import sort from "./helpers/sort";

const LIST = [15, 1, 8];
const STOP_LIST = [251, 1, 50];

describe("promizr.find()", () => {

    test("should return first found result filtered by iterator", async () => {
        const spy = jest.fn(num => num % 2 === 1);

        const result = await find(LIST, num => timeout(num).then(() => spy(num)));

        expect(result).toBe(LIST[1]);
    });

    test("should call each provided methods with given values in parallel", async () => {
        const spy = jest.fn((...args) => false);

        await find(LIST, (num, i, list) => timeout(num).then(() => spy(num, i, list)));

        expect(spy).toHaveBeenCalledTimes(3);

        const ordered = sort(LIST);
        for (let i = 0; i < LIST.length; i++) {
            expect(spy).toHaveBeenNthCalledWith(i + 1, ordered[i], LIST.indexOf(ordered[i]), LIST);
        }
    });

    test("should return undefined if no result found", async () => {
        const spy = jest.fn(num => false);

        const result = await find(LIST, num => timeout(num).then(() => spy(num)))

        expect(spy).toHaveBeenCalledTimes(3);

        expect(result).toBeUndefined();
    });

    test("should stop if an item is found", async () => {
        const spy = jest.fn(num => num % 2 === 1);
        const iterator = jest.fn(num => timeout(num).then(() => spy(num)));

        await find(STOP_LIST, iterator);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(STOP_LIST[1]);

        expect(iterator).toHaveBeenCalledTimes(3)
        expect(iterator).toHaveBeenNthCalledWith(1, STOP_LIST[0], 0, STOP_LIST);
        expect(iterator).toHaveBeenNthCalledWith(2, STOP_LIST[1], 1, STOP_LIST);
        expect(iterator).toHaveBeenNthCalledWith(3, STOP_LIST[2], 2, STOP_LIST);
    });

    test("should reject if an iterator throws", async () => {
        const spy = jest.fn();
        const err = new Error("test");

        spy.mockResolvedValueOnce(false);
        spy.mockRejectedValueOnce(err);
        spy.mockResolvedValueOnce(false);

        await expect(find(LIST, spy))
            .rejects.toBe(err);
    });

    test("should stop if an iterator throws", async () => {
        const spy = jest.fn(num => false);
        const err = new Error("test");

        const iterator = jest.fn(num => {
            return timeout(num).then(() => {
                if (num === STOP_LIST[2]) {
                    throw err;
                }

                return spy(num);
            });
        });

        await expect(find(STOP_LIST, iterator))
            .rejects.toBe(err);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(STOP_LIST[1]);

        expect(iterator).toHaveBeenCalledTimes(3)
        expect(iterator).toHaveBeenNthCalledWith(1, STOP_LIST[0], 0, STOP_LIST);
        expect(iterator).toHaveBeenNthCalledWith(2, STOP_LIST[1], 1, STOP_LIST);
        expect(iterator).toHaveBeenNthCalledWith(3, STOP_LIST[2], 2, STOP_LIST);
    });

});
