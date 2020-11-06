import waterfall from "../lib/waterfall";

import timeout from "./helpers/timeout";

const LIST = [15, 1, 8] as const;

describe("waterfall function", () => {

    test("should call each task with previous task result as argument", async () => {
        const spy = jest.fn((a, b) => a + b);
        const executors = LIST.map(a => (b: number | undefined) => timeout(a).then(() => spy(a, b || 0)));

        await waterfall(executors);

        expect(spy).toHaveBeenCalledTimes(3);

        expect(spy).toHaveBeenNthCalledWith(1, LIST[0], 0);
        expect(spy).toHaveBeenNthCalledWith(2, LIST[1], LIST[0]);
        expect(spy).toHaveBeenNthCalledWith(3, LIST[2], LIST[0] + LIST[1]);
    });

    test("should return the result of the last task", async () => {
        const spy = jest.fn((a, b) => a + b);
        const executors = LIST.map(a => (b: number | undefined) => timeout(a).then(() => spy(a, b || 0)));

        const result = await waterfall(executors);

        expect(result).toBe(LIST[0] + LIST[1] + LIST[2]);
    });

    test("should stop if an executor throws", async () => {
        const spy = jest.fn();
        const err = new Error("test");

        let i = 0;

        const executors = LIST.map(num => jest.fn(() => {
            if (i++ === 1) {
                throw err;
            }

            return timeout(num).then(() => spy(num));
        }));

        await expect(waterfall(executors))
            .rejects.toBe(err);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(LIST[0]);

        expect(executors[0]).toHaveBeenCalledTimes(1);
        expect(executors[1]).toHaveBeenCalledTimes(1);
        expect(executors[2]).not.toHaveBeenCalled();

    });

});