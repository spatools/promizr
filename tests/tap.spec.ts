import tap from "../lib/tap";

import timeout from "./helpers/timeout";

describe("promizr.tap()", () => {

    test("should returns a function that executes the task when called", async () => {
        const spy = jest.fn();

        const fn = tap(spy);

        expect(spy).not.toHaveBeenCalled();

        await fn("arg");

        expect(spy).toHaveBeenCalledTimes(1);
    });

    test("should the function returns the given argument", async () => {
        const argument = { arg: "value" };

        const res = await tap(timeout, 10)(argument);

        expect(res).toBe(argument);
    });

    test("should the function apply passed args to task", async () => {
        const spy = jest.fn((num, arg) => timeout(num));

        await tap(spy, 10, "other")("arg");

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(10, "other");
    });

    test("should stop if task throws", async () => {
        const err = new Error("test");
        const spy = jest.fn(() => { throw err; });

        await expect(tap(spy)("arg"))
            .rejects.toBe(err);
    });

});
