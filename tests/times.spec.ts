import times from "../lib/times";

import timeout from "./helpers/timeout";
import sort from "./helpers/sort";

const LIST = [15, 1, 8];
const STOP_LIST = [251, 1, 50];

describe("promizr.times()", () => {

    test("should call provided function a given number of times", async () => {
        let count = 0;
        const spy = jest.fn(() => LIST[count++]);

        await times(3, spy);

        expect(spy).toHaveBeenCalledTimes(3);
        expect(count).toBe(3);
    });

    test("should make all calls in parallel", async () => {
        let count = 0;

        const spy = jest.fn();
        const task = () => {
            const num = LIST[count++];
            return timeout(num).then(() => spy(num));
        };

        await times(3, task);

        expect(spy).toHaveBeenCalledTimes(3);
        expect(count).toBe(3);

        const ordered = sort(LIST);
        for (let i = 0; i < LIST.length; i++) {
            expect(spy).toHaveBeenNthCalledWith(i + 1, ordered[i]);
        }
    });

    test("should return an array with each values returned by tasks", async () => {
        let count = 0;

        const spy = jest.fn(num => num * num);
        const task = () => {
            const num = LIST[count++];
            return timeout(num).then(() => spy(num));
        };

        const results = await times(3, task);
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
            const num = STOP_LIST[count++];

            return timeout(num).then(() => {
                if (num === STOP_LIST[2]) {
                    throw err;
                }

                spy(num);
            });
        });

        await expect(times(3, task))
            .rejects.toBe(err);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(STOP_LIST[1]);

        expect(task).toHaveBeenCalledTimes(3);
    });

});
