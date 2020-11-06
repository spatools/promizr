import resolve from "../lib/resolve";

describe("promizr.resolve()", () => {

    test("should be an alias to Promise.resolve", async () => {
        const res = await resolve("result");
        expect(res).toBe("result");
    });

});