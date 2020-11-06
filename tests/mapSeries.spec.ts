import mapSeries from "../lib/mapSeries";

import timeout from "./helpers/timeout";

const LIST = [15, 1, 8];
const STOP_LIST = [251, 1, 50];

describe("promizr.mapSeries()", () => {

    test("should returns the mapped array", async () => {
        const spy = jest.fn(num => num * num);

        const res = await mapSeries(LIST, num => timeout(num).then(() => spy(num)));

        expect(res).toEqual(LIST.map(n => n * n));
    });

    test("should call each provided methods with given values in series", async () => {
        const spy = jest.fn();

        await mapSeries(LIST, (num, index, list) => timeout(num).then(() => spy(num, index, list)));

        expect(spy).toHaveBeenCalledTimes(LIST.length);

        for (let i = 0; i < LIST.length; i++) {
            expect(spy).toHaveBeenNthCalledWith(i + 1, LIST[i], i, LIST);
        }
    });

    test("should reject if an iterator throws", async () => {
        const spy = jest.fn();
        const err = new Error("test");

        spy.mockResolvedValueOnce(undefined);
        spy.mockRejectedValueOnce(err);
        spy.mockResolvedValueOnce(undefined);

        await expect(mapSeries(LIST, spy))
            .rejects.toBe(err);
    });

    test("should stop if an iterator throws", async () => {
        const spy = jest.fn();
        const err = new Error("test");

        const iterator = jest.fn((num: number, i: number) => {
            return timeout(num).then(() => {
                if (i === 1) {
                    return Promise.reject(err);
                }

                spy(num);
            });
        });

        await expect(mapSeries(STOP_LIST, iterator))
            .rejects.toBe(err);


        expect(spy).toBeCalledTimes(1);
        expect(spy).toBeCalledWith(STOP_LIST[0]);

        expect(iterator).toBeCalledTimes(2);
        expect(iterator).toHaveBeenNthCalledWith(1, STOP_LIST[0], 0, STOP_LIST);
        expect(iterator).toHaveBeenNthCalledWith(2, STOP_LIST[1], 1, STOP_LIST);
    });

});
