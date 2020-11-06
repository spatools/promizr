import cbpromisify from "../lib/cbpromisify";

describe("promizr.cbpromisify()", () => {

    describe("with no owner", () => {

        test("should return a function that calls the inner function with the generated callbacks", async () => {
            const spy = jest.fn(multiCallbackFunction);

            const fn = cbpromisify(spy);

            expect(spy).not.toHaveBeenCalled();

            await fn("result", false, null);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith("result", false, null, expect.any(Function), expect.any(Function));
        });

        test("should return the result of the callback function", async () => {
            const res = await cbpromisify(multiCallbackFunction)("result", false, null);
            expect(res).toBe("result");
        });

        test("should return the result of the callback function", async () => {
            const res = await cbpromisify(multiCallbackFunction)("result", false, null);
            expect(res).toBe("result");
        });

        test("should return an array of the callback function results if it has multiple results", async () => {
            const res = await cbpromisify(multiCallbackFunction)("result", true, null);
            expect(res).toEqual(["result", true]);
        });

        test("should return void if the callback function has no result", async () => {
            const res = await cbpromisify(multiCallbackFunction)(undefined, true, null);
            expect(res).toBeUndefined();
        });

        test("should throw if the callback function returns an error", async () => {
            const err = new Error("test");

            await expect(cbpromisify(multiCallbackFunction)("result", false, err))
                .rejects.toBe(err);
        });
    });

    describe("with owner", () => {
        const owner = {};

        const thisMultiCallbackFunction = function (this: unknown, ...args: Parameters<typeof multiCallbackFunction>): void {
            expect(this).toBe(owner);
            multiCallbackFunction(...args);
        };

        test("should return a function that calls the inner function with the generated callbacks", async () => {
            const spy = jest.fn(thisMultiCallbackFunction);

            const fn = cbpromisify(owner, spy);

            expect(spy).not.toHaveBeenCalled();

            await fn("result", false, null);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith("result", false, null, expect.any(Function), expect.any(Function));
        });

        test("should return the result of the callback function", async () => {
            const res = await cbpromisify(owner, thisMultiCallbackFunction)("result", false, null);
            expect(res).toBe("result");
        });

        test("should return the result of the callback function", async () => {
            const res = await cbpromisify(owner, thisMultiCallbackFunction)("result", false, null);
            expect(res).toBe("result");
        });

        test("should return an array of the callback function results if it has multiple results", async () => {
            const res = await cbpromisify(owner, thisMultiCallbackFunction)("result", true, null);
            expect(res).toEqual(["result", true]);
        });

        test("should return void if the callback function has no result", async () => {
            const res = await cbpromisify(owner, thisMultiCallbackFunction)(undefined, true, null);
            expect(res).toBeUndefined();
        });

        test("should throw if the callback function returns an error", async () => {
            const err = new Error("test");

            await expect(cbpromisify(owner, thisMultiCallbackFunction)("result", false, err))
                .rejects.toBe(err);
        });
    });

});

function multiCallbackFunction(res: string | undefined, multi: boolean | null | undefined, throws: Error | null | undefined, successCallback: (...args: any[]) => void, errorCallback: (err: Error) => void): void {
    if (throws) {
        setImmediate(() => errorCallback(throws));
        return;
    }

    if (typeof res === "undefined") {
        setImmediate(() => successCallback());
    }

    if (multi) {
        setImmediate(() => successCallback(res, true));
        return;
    }

    setImmediate(() => successCallback(res));
}
