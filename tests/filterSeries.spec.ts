import filterSeries from "../lib/filterSeries";

import timeout from "./helpers/timeout";
import sort from "./helpers/sort";

const LIST = [15, 1, 8];
const STOP_LIST = [251, 1, 50];

describe("promizr.filterSeries()", () => {

    test("should returns the filtered array", async () => {
        const spy = jest.fn(num => num % 2 === 1);

        const res = await filterSeries(LIST, num => timeout(num).then(() => spy(num)));

        expect(res).toEqual(LIST.filter(n => n % 2 === 1));
    });

    test("should call each provided methods with given values in series", async () => {
        const spy = jest.fn();

        await filterSeries(LIST, (num, index, list) => timeout(num).then(() => spy(num, index, list)));

        expect(spy).toHaveBeenCalledTimes(LIST.length);

        for (let i = 0; i < LIST.length; i++) {
            expect(spy).toHaveBeenNthCalledWith(i + 1, LIST[i], i, LIST);
        }
    });

    test("should reject if an iterator throws", async () => {
        const spy = jest.fn();
        const err = new Error("test");

        spy.mockResolvedValueOnce(true);
        spy.mockRejectedValueOnce(err);
        spy.mockResolvedValueOnce(false);

        await expect(filterSeries(LIST, spy))
            .rejects.toBe(err);
    });

    test("should stop if an iterator throws", async () => {
        const spy = jest.fn(n => n % 2 === 1);
        const err = new Error("test");

        const iterator = jest.fn((num: number, i: number) => {
            return timeout(num).then(() => {
                if (i === 1) {
                    return Promise.reject(err);
                }

                return spy(num);
            });
        });

        await expect(filterSeries(STOP_LIST, iterator))
            .rejects.toBe(err);


        expect(spy).toBeCalledTimes(1);
        expect(spy).toBeCalledWith(STOP_LIST[0]);

        expect(iterator).toBeCalledTimes(2);
        expect(iterator).toHaveBeenNthCalledWith(1, STOP_LIST[0], 0, STOP_LIST);
        expect(iterator).toHaveBeenNthCalledWith(2, STOP_LIST[1], 1, STOP_LIST);
    });

});
