import doWhilst from "../lib/doWhilst";

import timeout from "./helpers/timeout";

const LIST = [15, 1, 8];

describe("promizr.doWhilst()", () => {

    test("should call provided method while given test pass", async () => {
        const spy = jest.fn(num => num);
        let i = 0;

        const test = jest.fn(res => res !== LIST[1]);
        const executor = () => {
            const num = LIST[i++];
            return timeout(num).then(() => spy(num));
        };

        await doWhilst(executor, test);

        expect(spy).toHaveBeenCalledTimes(2);
        expect(test).toHaveBeenCalledTimes(2);

        expect(spy).toHaveBeenNthCalledWith(1, LIST[0]);
        expect(spy).toHaveBeenNthCalledWith(2, LIST[1]);

    });

    test("should accept a Promise as test result", async () => {
        let i = 0;

        const test = jest.fn(() => Promise.resolve(LIST[i] % 2 !== 0));
        const executor = jest.fn(() => timeout(LIST[i++]));

        await doWhilst(executor, test);

        expect(executor).toHaveBeenCalledTimes(2);
        expect(test).toHaveBeenCalledTimes(2);
    });

    test("should pass the result of the task to the test function", async () => {
        const spy = jest.fn(num => num);
        let i = 0;

        const test = jest.fn(res => res !== LIST[1]);
        const executor = () => {
            const num = LIST[i++];
            return timeout(num).then(() => spy(num));
        };

        await doWhilst(executor, test);

        expect(spy).toHaveBeenCalledTimes(2);
        expect(test).toHaveBeenCalledTimes(2);

        expect(test).toHaveBeenNthCalledWith(1, LIST[0]);
        expect(test).toHaveBeenNthCalledWith(2, LIST[1]);
    });

    test("should stop if an executor throws", async () => {
        const spy = jest.fn(num => num);
        const err = new Error("test");

        let i = 0;

        const test = jest.fn(() => true);
        const executor = jest.fn(() => {
            const num = LIST[i++];
            if (num === LIST[1]) {
                throw err;
            }

            return timeout(num).then(() => spy(num));
        });

        await expect(doWhilst(executor, test))
            .rejects.toBe(err);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(LIST[0]);

        expect(test).toHaveBeenCalledTimes(1);
        expect(executor).toHaveBeenCalledTimes(2);
    });

    test("should stop if a test throws", async () => {
        const spy = jest.fn(num => num);
        const err = new Error("test");

        let i = 0;

        const test = jest.fn(res => {
            if (res === LIST[1]) {
                throw err;
            }
            return true;
        });

        const executor = jest.fn(() => {
            const num = LIST[i++];
            return timeout(num).then(() => spy(num));
        });

        await expect(doWhilst(executor, test))
            .rejects.toBe(err);

        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenNthCalledWith(1, LIST[0]);
        expect(spy).toHaveBeenNthCalledWith(2, LIST[1]);

        expect(test).toHaveBeenCalledTimes(2);
        expect(executor).toHaveBeenCalledTimes(2);
    });

});
