import parallel from "../lib/parallel";

import timeout from "./helpers/timeout";
import sort from "./helpers/sort";
import createExecutorObject from "./helpers/createExecutorObject";

const LIST = [15, 1, 8];
const STOP_LIST = [251, 1, 50];

describe("promizr.parallel()", () => {

    describe("with an array", () => {

        test("should call each provided methods with given values in parallel", async () => {
            const spy = jest.fn();

            await parallel(LIST.map(num => () => timeout(num).then(() => spy(num))));

            expect(spy).toHaveBeenCalledTimes(3);

            const ordered = sort(LIST);
            for (let i = 0; i < LIST.length; i++) {
                expect(spy).toHaveBeenNthCalledWith(i + 1, ordered[i]);
            }
        });

        test("should return an array with each values returned by executors", async () => {
            const spy = jest.fn(num => num * num);
            const executors = LIST.map(num => () => timeout(num).then(() => spy(num)));

            const results = await parallel(executors);

            expect(spy).toHaveBeenCalledTimes(3);

            expect(results.length).toBe(3);
            expect(results[0]).toBe(LIST[0] * LIST[0]);
            expect(results[1]).toBe(LIST[1] * LIST[1]);
            expect(results[2]).toBe(LIST[2] * LIST[2]);

        });

        test("should stop if an executor throws", async () => {
            const spy = jest.fn();
            const err = new Error("test");

            const executors = STOP_LIST.map(num => jest.fn(() => {
                return timeout(num).then(() => {
                    if (num === STOP_LIST[2]) {
                        throw err;
                    }

                    spy(num);
                });
            }));

            await expect(parallel(executors))
                .rejects.toBe(err);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith(STOP_LIST[1]);

            expect(executors[0]).toHaveBeenCalledTimes(1);
            expect(executors[1]).toHaveBeenCalledTimes(1);
            expect(executors[2]).toHaveBeenCalledTimes(1);

        });

    });

    describe("whith an object argument", () => {

        test("should call each provided methods with given values in parallel", async () => {
            const spy = jest.fn();
            const executors = createExecutorObject(LIST, num => () => timeout(num).then(() => spy(num)), true);

            await parallel(executors);

            expect(spy).toHaveBeenCalledTimes(3);

            const ordered = sort(LIST);
            for (let i = 0; i < LIST.length; i++) {
                expect(spy).toHaveBeenNthCalledWith(i + 1, ordered[i]);
            }
        });

        test("should return an object with each values returned by executors", async () => {
            const spy = jest.fn(num => num * num);
            const executors = createExecutorObject(LIST, num => () => timeout(num).then(() => spy(num)));

            const results = await parallel(executors);
            expect(spy).toHaveBeenCalledTimes(3);

            expect(Object.keys(results).length).toBe(3);

            expect(results[`property-${LIST[0]}`]).toBe(LIST[0] * LIST[0]);
            expect(results[`property-${LIST[1]}`]).toBe(LIST[1] * LIST[1]);
            expect(results[`property-${LIST[2]}`]).toBe(LIST[2] * LIST[2]);

        });

        test("should stop if an executor throws", async () => {
            const spy = jest.fn();
            const err = new Error("test");

            const executors = createExecutorObject(STOP_LIST, num => jest.fn(() => {
                return timeout(num).then(() => {
                    if (num === STOP_LIST[2]) {
                        throw err;
                    }

                    spy(num);
                });
            }));

            await expect(parallel(executors))
                .rejects.toBe(err);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith(STOP_LIST[1]);

            expect(executors[`property-${STOP_LIST[0]}`]).toHaveBeenCalledTimes(1);
            expect(executors[`property-${STOP_LIST[1]}`]).toHaveBeenCalledTimes(1);
            expect(executors[`property-${STOP_LIST[2]}`]).toHaveBeenCalledTimes(1);
        });

    });

});
