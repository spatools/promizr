import forever from "../lib/forever";

import timeout from "./helpers/timeout";

const RUNS = 10;

describe("promizr.forever", () => {

    test("should call the method until forever until it throws", async () => {
        const err = new Error("test");

        let i = 0;

        const spy = jest.fn(() => {
            if (++i === RUNS) {
                throw err;
            }

            return timeout(i);
        });

        await expect(forever(spy))
            .rejects.toBe(err);

        expect(spy).toHaveBeenCalledTimes(RUNS);
    });

});
