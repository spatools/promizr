import denodify from "../lib/denodify";

describe("promizr.denodify()", () => {

    describe("with no owner", () => {

        test("should call the inner function with a generated callback", async () => {
            const spy = jest.fn(nodeStyleFunction);

            await denodify(spy, "result", false, null);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith("result", false, null, expect.any(Function));
        });

        test("should return the result of the callback function", async () => {
            const res = await denodify(nodeStyleFunction, "result", false, null);
            expect(res).toBe("result");
        });

        test("should return the result of the callback function", async () => {
            const res = await denodify(nodeStyleFunction, "result", false, null);
            expect(res).toBe("result");
        });

        test("should return an array of the callback function results if it has multiple results", async () => {
            const res = await denodify(nodeStyleFunction, "result", true, null);
            expect(res).toEqual(["result", true]);
        });

        test("should return void if the callback function has no result", async () => {
            const res = await denodify(nodeStyleFunction, undefined, true, null);
            expect(res).toBeUndefined();
        });

        test("should throw if the callback function returns an error", async () => {
            const err = new Error("test");

            await expect(denodify(nodeStyleFunction, "result", false, err))
                .rejects.toBe(err);
        });
    });

    describe("with owner", () => {
        const owner = {};

        const thisNodeStyleFunction = function (this: unknown, ...args: Parameters<typeof nodeStyleFunction>): void {
            expect(this).toBe(owner);
            nodeStyleFunction(...args);
        };

        test("should return a function that calls the inner function with a generated callback", async () => {
            const spy = jest.fn(thisNodeStyleFunction);

            await denodify(owner, spy, "result", false, null);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith("result", false, null, expect.any(Function));
        });

        test("should return the result of the callback function", async () => {
            const res = await denodify(owner, thisNodeStyleFunction, "result", false, null);
            expect(res).toBe("result");
        });

        test("should return the result of the callback function", async () => {
            const res = await denodify(owner, thisNodeStyleFunction, "result", false, null);
            expect(res).toBe("result");
        });

        test("should return an array of the callback function results if it has multiple results", async () => {
            const res = await denodify(owner, thisNodeStyleFunction, "result", true, null);
            expect(res).toEqual(["result", true]);
        });

        test("should return void if the callback function has no result", async () => {
            const res = await denodify(owner, thisNodeStyleFunction, undefined, true, null);
            expect(res).toBeUndefined();
        });

        test("should throw if the callback function returns an error", async () => {
            const err = new Error("test");

            await expect(denodify(owner, thisNodeStyleFunction, "result", false, err))
                .rejects.toBe(err);
        });
    });

});

function nodeStyleFunction(res: string | undefined, multi: boolean | null | undefined, throws: Error | null | undefined, cb: (err?: Error | null, ...args: any[]) => void): void {
    if (throws) {
        setImmediate(() => cb(throws));
        return;
    }

    if (typeof res === "undefined") {
        setImmediate(() => cb());
    }

    if (multi) {
        setImmediate(() => cb(null, res, true));
        return;
    }

    setImmediate(() => cb(null, res));
}
