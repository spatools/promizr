import nextTick from "../lib/nextTick";

jest.useFakeTimers();

describe("promizr.nextTick()", () => {

    test("should return a Promise that resolves on next tick", () => {
        const callback = jest.fn();
        const res = nextTick(callback);

        expect(res).toBeUndefined();

        expect(setImmediate).toHaveBeenCalledTimes(1);
        expect(setImmediate).toHaveBeenCalledWith(callback);

        expect(callback).not.toHaveBeenCalled();

        jest.runAllImmediates();

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith();
    });

});
