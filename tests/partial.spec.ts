import partial from "../lib/partial";

describe("promizr.partial()", () => {

    test("should create a function which call task with combined arguments", async () => {
        const spy = jest.fn((arg: string, test: boolean, arg2: string, count: number) => `${arg}-${test}-${arg2}-${count}`);
        const fn = partial(spy, "arg", true);

        expect(spy).not.toHaveBeenCalled();

        await fn("arg2", 2);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith("arg", true, "arg2", 2);
    });

    test("should resolve with the task result if sync", async () => {
        const spy = jest.fn((arg: string, test: boolean, arg2: string, count: number) => `${arg}-${test}-${arg2}-${count}`);

        const promise = partial(spy, "arg", true)("arg2", 2);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(promise).toEqual(expect.any(Promise));

        await expect(promise)
            .resolves.toBe("arg-true-arg2-2");
    });

    test("should resolve with the task resolution if async", async () => {
        const spy = jest.fn(async (arg: string, test: boolean, arg2: string, count: number) => `${arg}-${test}-${arg2}-${count}`);

        const promise = partial(spy, "arg", true)("arg2", 2);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(promise).toEqual(expect.any(Promise));

        await expect(promise)
            .resolves.toBe("arg-true-arg2-2");
    });

    test("should reject Promise if task throws", async () => {
        const err = new Error("test");
        const spy = jest.fn(() => { throw err; });

        const promise = partial(spy)();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(promise).toEqual(expect.any(Promise));

        await expect(promise)
            .rejects.toBe(err);
    });

    test("should reject Promise if task rejects", async () => {
        const err = new Error("test");
        const spy = jest.fn(async () => { throw err; });

        const promise = partial(spy)();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(promise).toEqual(expect.any(Promise));

        await expect(promise)
            .rejects.toBe(err);
    });

});
