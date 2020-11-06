import ProgressPromise from "../lib/ProgressPromise";

import ProgressContext from "./helpers/ProgressContext";

describe("promizr.ProgressPromise", () => {

    describe("contructor", () => {

        test("should call executor arguments with three functions", () => {
            const spy = jest.fn();
            new ProgressPromise(spy);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), expect.any(Function));
        });

        test("should resolve when first function is called", async () => {
            const spy = jest.fn();

            let resolve: (value?: string) => void = () => void 0;
            const promise = new ProgressPromise(r => resolve = r).then(spy);

            expect(spy).not.toHaveBeenCalled();

            resolve("result");

            await promise;

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith("result");
        });

        test("should reject when second function is called", async () => {
            const spy = jest.fn();

            let reject: (reason: unknown) => void = () => void 0;
            const promise = new ProgressPromise((r1, r2) => reject = r2).catch(spy);

            expect(spy).not.toHaveBeenCalled();

            const err = new Error("test");
            reject(err);

            await promise;

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith(err);
        });

        test("should reject if executor function throw an error", async () => {
            const err = new Error("This is an error");
            const spy = jest.fn();

            const promise = new ProgressPromise(() => { throw err; }).catch(spy);

            expect(spy).not.toHaveBeenCalled();

            await promise;

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith(err);
        });

        test("should dispatch progress when calling the thrid callback", async () => {
            let progress: (value: number) => void = () => void 0;
            const promise = new ProgressPromise((r, re, pr) => { progress = pr; });

            const spy1 = jest.fn();
            const spy2 = jest.fn();

            promise.progress(spy1).progress(spy2);

            expect(spy1).not.toHaveBeenCalled();
            expect(spy2).not.toHaveBeenCalled();

            progress(0.5);

            expect(spy1).toHaveBeenCalledTimes(1);
            expect(spy2).toHaveBeenCalledTimes(1);

            expect(spy1).toHaveBeenCalledWith(0.5);
            expect(spy2).toHaveBeenCalledWith(0.5);
        });

    });

    describe(".progress()", () => {

        test("should returns this", async () => {
            const p1 = new ProgressPromise(jest.fn());
            const p2 = p1.progress();

            expect(p1).toBe(p2);
        });

        test("should register callbacks passed to progress", async () => {
            let progress: (value: number) => void = () => void 0;
            const promise = new ProgressPromise((r, re, pr) => { progress = pr; });

            const spy1 = jest.fn();
            const spy2 = jest.fn();

            promise.progress(spy1).progress(spy2);

            expect(spy1).not.toHaveBeenCalled();
            expect(spy2).not.toHaveBeenCalled();

            progress(0.5);

            expect(spy1).toHaveBeenCalledTimes(1);
            expect(spy2).toHaveBeenCalledTimes(1);

            expect(spy1).toHaveBeenCalledWith(0.5);
            expect(spy2).toHaveBeenCalledWith(0.5);
        });

        test("should not dispatch progress after resolution", async () => {
            let resolve: (value: string) => void = () => void 0;
            let progress: (value: number) => void = () => void 0;
            const promise = new ProgressPromise((r, re, pr) => { resolve = r; progress = pr; });

            const spy1 = jest.fn();
            const spy2 = jest.fn();

            promise.progress(spy1).progress(spy2);

            expect(spy1).not.toHaveBeenCalled();
            expect(spy2).not.toHaveBeenCalled();

            progress(0.5);

            expect(spy1).toHaveBeenCalledTimes(1);
            expect(spy2).toHaveBeenCalledTimes(1);

            resolve("result");
            await promise;

            progress(1);

            expect(spy1).toHaveBeenCalledTimes(1);
            expect(spy2).toHaveBeenCalledTimes(1);
        });

        test("should not register callback after resolution", async () => {
            let resolve: (value: string) => void = () => void 0;
            let progress: (value: number) => void = () => void 0;
            const promise = new ProgressPromise((r, re, pr) => { resolve = r; progress = pr; });

            const spy1 = jest.fn();
            const spy2 = jest.fn();
            const spy3 = jest.fn();

            promise.progress(spy1).progress(spy2);

            progress(0.5);

            expect(spy1).toHaveBeenCalledTimes(1);
            expect(spy2).toHaveBeenCalledTimes(1);

            resolve("result");
            await promise;

            promise.progress(spy3);

            expect(spy3).toHaveBeenCalledTimes(1);

            progress(1);

            expect(spy1).toHaveBeenCalledTimes(1);
            expect(spy2).toHaveBeenCalledTimes(1);
            expect(spy3).toHaveBeenCalledTimes(1);
        });

        test("should call onprogress immediately if progress already have a value", async () => {
            let progress: (value: number) => void = () => void 0;
            const promise = new ProgressPromise((r, re, pr) => { progress = pr; });

            const spy1 = jest.fn();

            progress(0.5);

            expect(spy1).not.toHaveBeenCalled();

            promise.progress(spy1);

            expect(spy1).toHaveBeenCalledTimes(1);
        });

    });

    describe("static .all()", () => {

        test("should return an instance of ProgressPromise", () => {
            const result = ProgressPromise.all([]);
            expect(result).toBeInstanceOf(ProgressPromise);
        });

        test("should report progresses of each inner ProgressPromises", () => {
            const spy = jest.fn();
            const ctx = new ProgressContext(3);

            const promise = ProgressPromise.all(ctx.promises()).progress(spy);

            ctx.progress(0, 1);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith([1, undefined, undefined]);

            ctx.progress(1, 1);

            expect(spy).toHaveBeenCalledTimes(2);
            expect(spy).toHaveBeenCalledWith([1, 1, undefined]);

            ctx.progress(2, 1);

            expect(spy).toHaveBeenCalledTimes(3);
            expect(spy).toHaveBeenCalledWith([1, 1, 1]);
        });

        test("should report progresses of each inner ProgressPromises and undefined for others", () => {
            const spy = jest.fn();
            const ctx = new ProgressContext(3).addFake();

            const promise = ProgressPromise.all(ctx.promises()).progress(spy);

            ctx.progress(0, 1);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith([1, undefined, undefined, undefined]);

            ctx.progress(1, 1);

            expect(spy).toHaveBeenCalledTimes(2);
            expect(spy).toHaveBeenCalledWith([1, 1, undefined, undefined]);

            ctx.progress(2, 1);

            expect(spy).toHaveBeenCalledTimes(3);
            expect(spy).toHaveBeenCalledWith([1, 1, 1, undefined]);

            ctx.progress(3, 1);

            expect(spy).toHaveBeenCalledTimes(3);
            expect(spy).toHaveBeenCalledWith([1, 1, 1, undefined]);
        });

    });

    describe("static .race()", () => {

        test("should return an instance of ProgressPromise", () => {
            const result = ProgressPromise.race([]);
            expect(result).toBeInstanceOf(ProgressPromise);
        });

        test("should report progresses of each inner ProgressPromises", () => {
            const spy = jest.fn();
            const ctx = new ProgressContext(3);

            const promise = ProgressPromise.race(ctx.promises()).progress(spy);

            ctx.progress(0, 1);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith([1, undefined, undefined]);

            ctx.progress(1, 1);

            expect(spy).toHaveBeenCalledTimes(2);
            expect(spy).toHaveBeenCalledWith([1, 1, undefined]);

            ctx.progress(2, 1);

            expect(spy).toHaveBeenCalledTimes(3);
            expect(spy).toHaveBeenCalledWith([1, 1, 1]);
        });

        test("should report progresses of each inner ProgressPromises and undefined for others", () => {
            const spy = jest.fn();
            const ctx = new ProgressContext(3).addFake();

            const promise = ProgressPromise.race(ctx.promises()).progress(spy);

            ctx.progress(0, 1);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith([1, undefined, undefined, undefined]);

            ctx.progress(1, 1);

            expect(spy).toHaveBeenCalledTimes(2);
            expect(spy).toHaveBeenCalledWith([1, 1, undefined, undefined]);

            ctx.progress(2, 1);

            expect(spy).toHaveBeenCalledTimes(3);
            expect(spy).toHaveBeenCalledWith([1, 1, 1, undefined]);

            ctx.progress(3, 1);

            expect(spy).toHaveBeenCalledTimes(3);
            expect(spy).toHaveBeenCalledWith([1, 1, 1, undefined]);
        });

    });

});

