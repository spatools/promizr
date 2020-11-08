import partialOn from "../lib/partialOn";

describe("promizr.partialOn()", () => {

    describe("with a string", () => {

        test("should create a function which combine task with given arguments", async () => {
            const spy = jest.fn((arg: string, test: boolean, arg2: string, count: number) => `${arg}-${test}-${arg2}-${count}`);

            const owner = { test: spy };
            const fn = partialOn(owner, "test", "arg", true);

            expect(spy).not.toHaveBeenCalled();

            await fn("arg2", 2);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith("arg", true, "arg2", 2);
        });

        test("should use owner as this context when calling task", async () => {
            const spy = jest.fn(function (this: unknown, arg: string, test: boolean, arg2: string, count: number): string {
                expect(this).toBe(owner);
                return `${arg}-${test}-${arg2}-${count}`;
            });

            const owner = { test: spy };
            await partialOn(owner, "test", "arg", true)("arg2", 2);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test("should resolve with the task result if sync", async () => {
            const spy = jest.fn((arg: string, test: boolean, arg2: string, count: number) => `${arg}-${test}-${arg2}-${count}`);

            const owner = { test: spy };
            const promise = partialOn(owner, "test", "arg", true)("arg2", 2);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(promise).toEqual(expect.any(Promise));

            await expect(promise)
                .resolves.toBe("arg-true-arg2-2");
        });

        test("should resolve with the task resolution if async", async () => {
            const spy = jest.fn(async (arg: string, test: boolean, arg2: string, count: number) => `${arg}-${test}-${arg2}-${count}`);

            const owner = { test: spy };
            const promise = partialOn(owner, "test", "arg", true)("arg2", 2);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(promise).toEqual(expect.any(Promise));

            await expect(promise)
                .resolves.toBe("arg-true-arg2-2");
        });

        test("should reject Promise if task throws", async () => {
            const err = new Error("test");
            const spy = jest.fn(() => { throw err; });

            const owner = { test: spy };
            const promise = partialOn(owner, "test")();

            expect(spy).toHaveBeenCalledTimes(1);
            expect(promise).toEqual(expect.any(Promise));

            await expect(promise)
                .rejects.toBe(err);
        });

        test("should reject Promise if task rejects", async () => {
            const err = new Error("test");
            const spy = jest.fn(async () => { throw err; });

            const owner = { test: spy };
            const promise = partialOn(owner, "test")();

            expect(spy).toHaveBeenCalledTimes(1);
            expect(promise).toEqual(expect.any(Promise));

            await expect(promise)
                .rejects.toBe(err);
        });

    });

    describe("with a function", () => {
        const owner = {};

        test("should create a function which combine task with given arguments", async () => {
            const spy = jest.fn((arg: string, test: boolean, arg2: string, count: number) => `${arg}-${test}-${arg2}-${count}`);
            const fn = partialOn(owner, spy, "arg", true);

            expect(spy).not.toHaveBeenCalled();

            await fn("arg2", 2);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith("arg", true, "arg2", 2);
        });

        test("should use owner as this context when calling task", async () => {
            const spy = jest.fn(function (this: unknown, arg: string, test: boolean, arg2: string, count: number): string {
                expect(this).toBe(owner);
                return `${arg}-${test}-${arg2}-${count}`;
            });

            await partialOn(owner, spy, "arg", true)("arg2", 2);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test("should resolve with the task result if sync", async () => {
            const spy = jest.fn((arg: string, test: boolean, arg2: string, count: number) => `${arg}-${test}-${arg2}-${count}`);

            const promise = partialOn(owner, spy, "arg", true)("arg2", 2);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(promise).toEqual(expect.any(Promise));

            await expect(promise)
                .resolves.toBe("arg-true-arg2-2");
        });

        test("should resolve with the task resolution if async", async () => {
            const spy = jest.fn(async (arg: string, test: boolean, arg2: string, count: number) => `${arg}-${test}-${arg2}-${count}`);

            const promise = partialOn(owner, spy, "arg", true)("arg2", 2);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(promise).toEqual(expect.any(Promise));

            await expect(promise)
                .resolves.toBe("arg-true-arg2-2");
        });

        test("should reject Promise if task throws", async () => {
            const err = new Error("test");
            const spy = jest.fn(() => { throw err; });

            const promise = partialOn(owner, spy)();

            expect(spy).toHaveBeenCalledTimes(1);
            expect(promise).toEqual(expect.any(Promise));

            await expect(promise)
                .rejects.toBe(err);
        });

        test("should reject Promise if task rejects", async () => {
            const err = new Error("test");
            const spy = jest.fn(async () => { throw err; });

            const promise = partialOn(owner, spy)();

            expect(spy).toHaveBeenCalledTimes(1);
            expect(promise).toEqual(expect.any(Promise));

            await expect(promise)
                .rejects.toBe(err);
        });

    });

});
