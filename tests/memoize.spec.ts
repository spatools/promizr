import * as crypto from "crypto";

import memoize from "../lib/memoize";

import timeout from "./helpers/timeout";

describe("promizr.memoize()", () => {

    test("should returns a function that executes the task when called", async () => {
        const spy = jest.fn();
        const fn = memoize(spy);

        expect(spy).not.toHaveBeenCalled();

        await fn();

        expect(spy).toHaveBeenCalledTimes(1);
    });

    test("should pass arguments to the task", async () => {
        const spy = jest.fn();

        await memoize(spy)("arg");

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith("arg");
    });

    test("should return the result of the task", async () => {
        const spy = jest.fn(arg => timeout(20).then(() => `prefix-${arg}`));

        const res = await memoize(spy)("arg");

        expect(res).toBe("prefix-arg");
    });

    test("should memoize the call and do not call the function twice", async () => {
        const spy = jest.fn(arg => timeout(20).then(() => `prefix-${arg}`));
        const fn = memoize(spy);

        const res1 = await fn("arg1");
        const res2 = await fn("arg2");

        expect(spy).toHaveBeenCalledTimes(1);
        expect(res1).toBe(res2);
        expect(res1).toBe("prefix-arg1");
    });

    test("should memoize the call and hash parameters if hash = true", async () => {
        const spy = jest.fn((arg, force) => timeout(20).then(() => `prefix-${arg}-${force}`));
        const fn = memoize(spy, true);

        const res1 = await fn("arg1", true);
        const res2 = await fn("arg2", false);
        const res3 = await fn("arg2", false);
        const res4 = await fn("arg2", true);

        expect(spy).toHaveBeenCalledTimes(3);

        expect(res1).not.toBe(res2);
        expect(res2).toBe(res3);
        expect(res3).not.toBe(res4);

        expect(res1).toBe("prefix-arg1-true");
        expect(res2).toBe("prefix-arg2-false");
        expect(res4).toBe("prefix-arg2-true");
    });

    test("should memoize the call and use custom hash function if provided", async () => {
        const spy = jest.fn((arg, force) => timeout(20).then(() => `prefix-${arg}-${force}`));
        const hash = jest.fn(customHash);

        const fn = memoize(spy, hash);

        const args = [
            [Buffer.from("arg1"), true],
            [Buffer.from("arg2"), false],
            [Buffer.from("arg2"), false],
            [Buffer.from("arg2"), true]
        ] as const;

        const res1 = await fn(...args[0]);
        const res2 = await fn(...args[1]);
        const res3 = await fn(...args[2]);
        const res4 = await fn(...args[3]);

        expect(spy).toHaveBeenCalledTimes(3);
        expect(hash).toHaveBeenCalledTimes(4);

        expect(res1).not.toBe(res2);
        expect(res2).toBe(res3);
        expect(res3).not.toBe(res4);

        expect(res1).toBe("prefix-arg1-true");
        expect(res2).toBe("prefix-arg2-false");
        expect(res4).toBe("prefix-arg2-true");

        for (let i = 0; i < args.length; i++) {
            expect(hash).toHaveBeenNthCalledWith(i + 1, args[i]);
        }
    });

});

function customHash(args: unknown[]): string {
    return args.map(arg => {
        const buffer = Buffer.isBuffer(arg) ? arg : Buffer.from(String(arg));
        return crypto.createHash("sha1").update(buffer).digest("hex");
    }).join("/");
}
