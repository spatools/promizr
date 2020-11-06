import series from "../lib/series";

import timeout from "./helpers/timeout";
import createExecutorObject from "./helpers/createExecutorObject";

const LIST = [15, 1, 8];

describe("promizr.series()", () => {

    describe("with an array", () => {

        test("should call each provided methods with given values in series", async () => {
            const spy = jest.fn();

            await series(LIST.map(num => () => timeout(num).then(() => spy(num))));

            expect(spy).toHaveBeenCalledTimes(3);

            for (let i = 0; i < LIST.length; i++) {
                expect(spy).toHaveBeenNthCalledWith(i + 1, LIST[i]);
            }
        });

        test("should return an array with each values returned by executors", async () => {
            const spy = jest.fn(num => num * num);
            const executors = LIST.map(num => () => timeout(num).then(() => spy(num)));

            const results = await series(executors);

            expect(spy).toHaveBeenCalledTimes(3);

            expect(results.length).toBe(3);
            expect(results[0]).toBe(LIST[0] * LIST[0]);
            expect(results[1]).toBe(LIST[1] * LIST[1]);
            expect(results[2]).toBe(LIST[2] * LIST[2]);

        });

        test("should stop if an executor throws", async () => {
            const spy = jest.fn();
            const err = new Error("test");

            const executors = LIST.map(num => jest.fn(() => {
                if (num === LIST[1]) {
                    return Promise.reject(err);
                }

                return timeout(num).then(() => spy(num));
            }));

            await expect(series(executors))
                .rejects.toBe(err);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith(LIST[0]);

            expect(executors[0]).toHaveBeenCalledTimes(1);
            expect(executors[1]).toHaveBeenCalledTimes(1);
            expect(executors[2]).not.toHaveBeenCalled();

        });

    });

    describe("whith an object argument", () => {

        test("should call each provided methods with given values in series", async () => {
            const spy = jest.fn();
            const executors = createExecutorObject(LIST, num => () => timeout(num).then(() => spy(num)), true);

            await series(executors);

            expect(spy).toHaveBeenCalledTimes(3);

            for (let i = 0; i < LIST.length; i++) {
                expect(spy).toHaveBeenNthCalledWith(i + 1, LIST[i]);
            }
        });

        test("should return an object with each values returned by executors", async () => {
            const spy = jest.fn(num => num * num);
            const executors = createExecutorObject(LIST, num => () => timeout(num).then(() => spy(num)));

            const results = await series(executors);
            expect(spy).toHaveBeenCalledTimes(3);

            expect(Object.keys(results).length).toBe(3);

            expect(results[`property-${LIST[0]}`]).toBe(LIST[0] * LIST[0]);
            expect(results[`property-${LIST[1]}`]).toBe(LIST[1] * LIST[1]);
            expect(results[`property-${LIST[2]}`]).toBe(LIST[2] * LIST[2]);

        });

        test("should stop if an executor throws", async () => {
            const spy = jest.fn();
            const err = new Error("test");

            let count = 0;

            const executors = createExecutorObject(LIST, num => jest.fn(() => {
                return timeout(num).then(() => {
                    if (count++ > 0) {
                        throw err;
                    }

                    return spy(num);
                });
            }));

            await expect(series(executors))
                .rejects.toBe(err);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith(LIST[0])

        });

    });

});
