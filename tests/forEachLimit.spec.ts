import eachLimit from "../lib/eachLimit";
import forEachLimit from "../lib/forEachLimit";

describe("promizr.forEachLimit()", () => {

    test("should be an alias of eachLimit", async () => {
        expect(forEachLimit).toBe(eachLimit);
    });

});
