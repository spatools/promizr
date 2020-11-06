import dir from "../lib/dir";

import timeout from "./helpers/timeout";

type Spy<T extends (...args: any[]) => any> = jest.SpyInstance<ReturnType<T>, Parameters<T>>;

describe("promizr.dir()", () => {
    let consoleDirSpy: Spy<typeof console.dir>;
    let consoleErrorSpy: Spy<typeof console.error>;
    beforeEach(() => {
        consoleDirSpy = jest.spyOn(console, "dir");
        consoleDirSpy.mockReturnValue();

        consoleErrorSpy = jest.spyOn(console, "error");
        consoleErrorSpy.mockReturnValue();
    });
    afterEach(() => {
        consoleDirSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    test("should call the given task with passed arguments", async () => {
        const task = jest.fn((...args) => timeout(10).then(() => "result"));

        await dir(task, "arg1", true);

        expect(task).toHaveBeenCalledTimes(1);
        expect(task).toHaveBeenCalledWith("arg1", true);
    });

    test("should return the result of the task", async () => {
        const task = jest.fn((...args) => timeout(10).then(() => "result"));

        const res = await dir(task, "arg1", true);

        expect(res).toBe("result");
    });

    test("should call console.dir with the result of the task if it succeeds", async () => {
        await dir((...args) => timeout(10).then(() => "result"), "arg1", true);

        expect(consoleDirSpy).toHaveBeenCalledTimes(1);
        expect(consoleDirSpy).toHaveBeenCalledWith("result");
    });

    test("should throw with the Error of the task if it throws", async () => {
        const err = new Error("test");

        await expect(dir((...args) => timeout(10).then(() => { throw err; }), "arg1", true))
            .rejects.toBe(err);
    });

    test("should call console.error with the result of the task if it throws", async () => {
        const err = new Error("test");

        await expect(dir((...args) => timeout(10).then(() => { throw err; }), "arg1", true))
            .rejects.toBe(err);

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith(err);
    });

});
