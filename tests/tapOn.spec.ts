import tapOn from "../lib/tapOn";

import timeout from "./helpers/timeout";

describe("promizr.tapOn()", () => {

    describe("with task as string", () => {

        test("should returns a function that executes the task when called", async () => {
            const owner = {
                "task": jest.fn()
            };

            const fn = tapOn(owner, "task");

            expect(owner.task).not.toHaveBeenCalled();

            await fn("arg");

            expect(owner.task).toHaveBeenCalledTimes(1);
        });

        test("should use the owner as this context when the task is called", async () => {
            const owner = {
                "task": jest.fn(function (this: unknown) {
                    expect(this).toBe(owner);
                })
            };

            await tapOn(owner, "task")("arg");

            expect(owner.task).toHaveBeenCalledTimes(1);
        });

        test("should the function returns the given argument", async () => {
            const owner = {
                "task": jest.fn()
            };

            const argument = { arg: "value" };

            const res = await tapOn(owner.task, timeout, 10)(argument);

            expect(res).toBe(argument);
        });

        test("should the function apply passed args to task", async () => {
            const owner = {
                "task": jest.fn((num, arg) => timeout(num))
            };

            await tapOn(owner, "task", 10, "other")("arg");

            expect(owner.task).toHaveBeenCalledTimes(1);
            expect(owner.task).toHaveBeenCalledWith(10, "other");
        });

        test("should stop if task throws", async () => {
            const err = new Error("test");
            const owner = {
                "task": jest.fn(() => { throw err; })
            };

            await expect(tapOn(owner, "task")("arg"))
                .rejects.toBe(err);
        });

    });

    describe("with task as function", () => {
        const owner = {};

        test("should returns a function that executes the task when called", async () => {
            const spy = jest.fn();

            const fn = tapOn(owner, spy);

            expect(spy).not.toHaveBeenCalled();

            await fn("arg");

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test("should use the owner as this context when the task is called", async () => {
            const spy = jest.fn(function (this: unknown) {
                expect(this).toBe(owner);
            });

            await tapOn(owner, spy)("arg");

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test("should the function returns the given argument", async () => {
            const argument = { arg: "value" };

            const res = await tapOn(owner, timeout, 10)(argument);

            expect(res).toBe(argument);
        });

        test("should the function apply passed args to task", async () => {
            const spy = jest.fn((num, arg) => timeout(num));

            await tapOn(owner, spy, 10, "other")("arg");

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith(10, "other");
        });

        test("should stop if task throws", async () => {
            const err = new Error("test");
            const spy = jest.fn(() => { throw err; });

            await expect(tapOn(owner, spy)("arg"))
                .rejects.toBe(err);
        });

    });

});
