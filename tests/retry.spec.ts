import retry from "../lib/retry";

describe("promizr.retry()", () => {

    test("should retry function if failed", async () => {
        let count = 0;

        const spy = jest.fn(() => {
            if (count++ < 2) {
                throw new Error("test");
            }
        });

        await retry(5, spy);

        expect(spy).toHaveBeenCalledTimes(3);
        expect(count).toBe(3);
    });

    test("should fail if function failed more than given times", async () => {
        const err = new Error("test");

        let count = 0;

        const spy = jest.fn(() => {
            count++;
            throw err;
        });

        await expect(retry(5, spy))
            .rejects.toBe(err);

        expect(spy).toHaveBeenCalledTimes(5);
        expect(count).toBe(5);

    });

});
