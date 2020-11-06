import eachSeries from "../lib/eachSeries";
import forEachSeries from "../lib/forEachSeries";

describe("promizr.forEachSeries()", () => {

    test("should be an alias of eachSeries", async () => {
        expect(forEachSeries).toBe(eachSeries);
    });

});
