import seq from "../lib/seq";

import timeout from "./helpers/timeout";

const LIST = [15, 1, 8];

describe("promizr.seq()", () => {

    test("should return a promised function which should transfer its arguments and owner to the first given task", async () => {
        const task = jest.fn((...args: number[]) => args.reduce((a, b) => a + b, 0));
        const owner = {};

        const fn = seq(task);

        expect(task).not.toHaveBeenCalled();

        await fn.apply(owner, LIST);

        expect(task).toHaveBeenCalledTimes(1);
        expect(task).toHaveBeenCalledWith(LIST[0], LIST[1], LIST[2]);
        // sinon.assert.calledOn(task, owner);
    });

    describe("when result called", () => {

        test("should call each task with previous task result as argument", async () => {
            const spy = jest.fn((a, b) => a + b);
            const executors = LIST.map(a => (b: number) => timeout(a).then(() => spy(a, b)));

            await seq(...executors)(0);

            expect(spy).toHaveBeenCalledTimes(3);

            expect(spy).toHaveBeenNthCalledWith(1, LIST[0], 0);
            expect(spy).toHaveBeenNthCalledWith(2, LIST[1], LIST[0]);
            expect(spy).toHaveBeenNthCalledWith(3, LIST[2], LIST[0] + LIST[1]);
        });

        test("should return the result of the last given task", async () => {
            const executors = LIST.map(a => (b: number) => timeout(a).then(() => a + b));

            const result = await seq(...executors)(0);
            expect(result).toBe(LIST[0] + LIST[1] + LIST[2]);
        });

        test("should resolved with void if empty array is passed", async () => {
            const res = await seq()();
            expect(res).toBeUndefined();
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

            await expect(seq(...executors)())
                .rejects.toBe(err);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith(LIST[0]);

            expect(executors[0]).toHaveBeenCalledTimes(1);
            expect(executors[1]).toHaveBeenCalledTimes(1);
            expect(executors[2]).not.toHaveBeenCalled()
        });

    });

});
