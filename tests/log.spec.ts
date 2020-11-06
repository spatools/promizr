import log from "../lib/log";

import timeout from "./helpers/timeout";

type Spy<T extends (...args: any[]) => any> = jest.SpyInstance<ReturnType<T>, Parameters<T>>;

describe("promizr.log()", () => {
    let consoleLogSpy: Spy<typeof console.log>;
    let consoleErrorSpy: Spy<typeof console.error>;
    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, "log");
        consoleLogSpy.mockReturnValue();

        consoleErrorSpy = jest.spyOn(console, "error");
        consoleErrorSpy.mockReturnValue();
    });
    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    test("should call the given task with passed arguments", async () => {
        const task = jest.fn((...args) => timeout(10).then(() => "result"));

        await log(task, "arg1", true);

        expect(task).toHaveBeenCalledTimes(1);
        expect(task).toHaveBeenCalledWith("arg1", true);
    });

    test("should return the result of the task", async () => {
        const task = jest.fn((...args) => timeout(10).then(() => "result"));

        const res = await log(task, "arg1", true);

        expect(res).toBe("result");
    });

    test("should call console.log with the result of the task if it succeeds", async () => {
        await log((...args) => timeout(10).then(() => "result"), "arg1", true);

        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        expect(consoleLogSpy).toHaveBeenCalledWith("result");
    });

    test("should throw with the Error of the task if it throws", async () => {
        const err = new Error("test");

        await expect(log((...args) => timeout(10).then(() => { throw err; }), "arg1", true))
            .rejects.toBe(err);
    });

    test("should call console.error with the result of the task if it throws", async () => {
        const err = new Error("test");

        await expect(log((...args) => timeout(10).then(() => { throw err; }), "arg1", true))
            .rejects.toBe(err);

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith(err);
    });

});
