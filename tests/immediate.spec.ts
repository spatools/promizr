import immediate from "../lib/immediate";

jest.useFakeTimers();

describe("promizr.immediate()", () => {

    test("should return a Promise that resolves on next tick", async () => {
        const resolved = jest.fn();
        const promise = immediate().then(resolved);

        expect(setImmediate).toHaveBeenCalledTimes(1);
        expect(setImmediate).toHaveBeenCalledWith(expect.any(Function));

        expect(resolved).not.toHaveBeenCalled();

        jest.runAllImmediates();

        await expect(promise).resolves.toBeUndefined();

        expect(resolved).toHaveBeenCalledTimes(1);
        expect(resolved).toHaveBeenCalledWith(undefined);
    });

});
