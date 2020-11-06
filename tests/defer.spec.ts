import defer from "../lib/defer";

describe("promizr.defer()", () => {

    test("should return a Deferred object", () => {
        const dfd = defer();

        expect(dfd).toHaveProperty("resolve", expect.any(Function));
        expect(dfd).toHaveProperty("reject", expect.any(Function));
        expect(dfd).toHaveProperty("promise", expect.any(Promise));
    });

    test("should resolve the Promise when resolve function is called", async () => {
        const spy = jest.fn();
        const dfd = defer();

        const promise = dfd.promise.then(spy);

        expect(spy).not.toHaveBeenCalled();

        dfd.resolve("value");

        await promise;

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith("value");
    });

    test("should reject the Promise when reject function is called", async () => {
        const spy = jest.fn();
        const dfd = defer();

        const promise = dfd.promise.catch(spy);

        expect(spy).not.toHaveBeenCalled();

        const err = new Error("test");
        dfd.reject(err);

        await promise;

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(err);
    });

});
