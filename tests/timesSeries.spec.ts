import timesSeries from "../lib/timesSeries";

import timeout from "./helpers/timeout";

const LIST = [15, 1, 8];

describe("promizr.timesSeries()", () => {

    test("should call provided function a given number of times", async () => {
        let count = 0;
        const spy = jest.fn(() => LIST[count++]);

        await timesSeries(3, spy);

        expect(spy).toHaveBeenCalledTimes(3);
        expect(count).toBe(3);
    });

    test("should make all calls in series", async () => {
        let count = 0;

        const spy = jest.fn();
        const task = () => {
            const num = LIST[count++];
            return timeout(num).then(() => spy(num));
        };

        await timesSeries(3, task);

        expect(spy).toHaveBeenCalledTimes(3);
        expect(count).toBe(3);

        for (let i = 0; i < LIST.length; i++) {
            expect(spy).toHaveBeenNthCalledWith(i + 1, LIST[i]);
        }
    });

    test("should return an array with each values returned by tasks", async () => {
        let count = 0;

        const spy = jest.fn(num => num * num);
        const task = () => {
            const num = LIST[count++];
            return timeout(num).then(() => spy(num));
        };

        const results = await timesSeries(3, task);
        expect(spy).toHaveBeenCalledTimes(3);

        expect(results).toHaveLength(3);
        expect(results[0]).toBe(LIST[0] * LIST[0]);
        expect(results[1]).toBe(LIST[1] * LIST[1]);
        expect(results[2]).toBe(LIST[2] * LIST[2]);

    });

    test("should stop if a task throws", async () => {
        let count = 0;

        const err = new Error("test");
        const spy = jest.fn();

        const task = jest.fn(() => {
            const num = LIST[count++];

            return timeout(num).then(() => {
                if (num === LIST[1]) {
                    throw err;
                }

                spy(num);
            });
        });

        await expect(timesSeries(3, task))
            .rejects.toBe(err);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(LIST[0]);

        expect(task).toHaveBeenCalledTimes(2);
    });

});
