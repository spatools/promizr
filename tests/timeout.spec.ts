import timeout from "../lib/timeout";

// jest.useFakeTimers();

describe("promizr.timeout()", () => {

    beforeEach(() => jest.useFakeTimers());

    test("should return a Promise that resolves when timer is done", async () => {
        const resolved = jest.fn();
        const promise = timeout(10).then(resolved);

        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 10);

        expect(resolved).not.toHaveBeenCalled();

        jest.runAllTimers();

        await expect(promise).resolves.toBeUndefined();

        expect(resolved).toHaveBeenCalledTimes(1);
        expect(resolved).toHaveBeenCalledWith(undefined);
    });

    test("should use 1 as default ms value if not provided", async () => {
        const resolved = jest.fn();
        const promise = timeout().then(resolved);

        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1);

        expect(resolved).not.toHaveBeenCalled();

        jest.runAllTimers();

        await expect(promise).resolves.toBeUndefined();

        expect(resolved).toHaveBeenCalledTimes(1);
        expect(resolved).toHaveBeenCalledWith(undefined);
    });

});
