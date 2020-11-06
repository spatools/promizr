import applyOn from "../lib/applyOn";

describe("promizr.applyOn()", () => {
    const owner = {};

    test("should create a function which call task with given arguments", async () => {
        const spy = jest.fn((arg: string, test: boolean) => `${arg}-${test}`);
        const fn = applyOn(owner, spy, "arg", true);

        expect(spy).not.toHaveBeenCalled();

        await fn();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith("arg", true);
    });

    test("should use owner as this context when calling task", async () => {
        const spy = jest.fn(function (this: unknown, arg: string, test: boolean): string {
            expect(this).toBe(owner);
            return `${arg}-${test}`;
        });

        await applyOn(owner, spy, "arg", true)();

        expect(spy).toHaveBeenCalledTimes(1);
    });

    test("should resolve with the task result if sync", async () => {
        const spy = jest.fn(() => "result");

        const promise = applyOn(owner, spy)();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(promise).toEqual(expect.any(Promise));

        await expect(promise)
            .resolves.toBe("result");
    });

    test("should resolve with the task resolution if async", async () => {
        const spy = jest.fn(async () => "result");

        const promise = applyOn(owner, spy)();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(promise).toEqual(expect.any(Promise));

        await expect(promise)
            .resolves.toBe("result");
    });

    test("should reject Promise if task throws", async () => {
        const err = new Error("test");
        const spy = jest.fn(() => { throw err; });

        const promise = applyOn(owner, spy)();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(promise).toEqual(expect.any(Promise));

        await expect(promise)
            .rejects.toBe(err);
    });

    test("should reject Promise if task rejects", async () => {
        const err = new Error("test");
        const spy = jest.fn(async () => { throw err; });

        const promise = applyOn(owner, spy)();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(promise).toEqual(expect.any(Promise));

        await expect(promise)
            .rejects.toBe(err);
    });

});
