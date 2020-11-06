import each from "../lib/each";
import forEach from "../lib/forEach";

describe("promizr.forEach()", () => {

    test("should be an alias of each", async () => {
        expect(forEach).toBe(each);
    });

});
