/// <reference path="tests.d.ts" />

import promizr = require("promizr");
import ProgressContext = require("./helpers/ProgressContext");

describe("ProgressPromise class", () => {

    describe("contructor", () => {

        it("should call executor arguments with three functions", () => {
            const
                spy = sinon.spy(),
                instance = new promizr.ProgressPromise(spy);

            sinon.assert.calledOnce(spy);
            sinon.assert.calledWithMatch(spy, sinon.match.func, sinon.match.func, sinon.match.func);
        });

        it("should resolve when first function is called", done => {
            let resolve: Function;

            const
                arg = 1,
                spy = sinon.spy(),
                promise = new promizr.ProgressPromise(r => resolve = r).then(spy);

            sinon.assert.notCalled(spy);

            promise.then(() => {
                sinon.assert.calledOnce(spy);
                sinon.assert.calledWithExactly(spy, arg);
            }).then(done, done);

            resolve(arg);
        });

        it("should reject when second function is called", done => {
            let reject: Function;

            const
                err = new Error("This is an error"),
                spy = sinon.spy(),
                promise = new promizr.ProgressPromise((r1, r2) => reject = r2).catch(spy);

            sinon.assert.notCalled(spy);

            promise.then(() => {
                sinon.assert.calledOnce(spy);
                sinon.assert.calledWithExactly(spy, err);
            }).then(done, done);

            reject(err);
        });

        it("should reject if executor function throw an error", done => {
            const
                err = new Error("This is an error"),
                spy = sinon.spy(),
                promise = new promizr.ProgressPromise(() => { throw err; }).catch(spy);

            sinon.assert.notCalled(spy);

            promise.then(() => {
                sinon.assert.calledOnce(spy);
                sinon.assert.calledWithExactly(spy, err);
            }).then(done, done);
        });

    });

    describe("static methods", () => {

        describe("all", () => {

            it("should return an instance of ProgressPromise", () => {
                const result = promizr.ProgressPromise.all([]);
                result.should.be.instanceOf(promizr.ProgressPromise);
            });

            it("should report progresses of each inner ProgressPromises", () => {
                const
                    spy = sinon.spy(),
                    ctx = new ProgressContext(3),
                    promise = promizr.ProgressPromise.all(ctx.promises()).progress(spy);

                ctx.progress(0, 1);

                sinon.assert.calledOnce(spy);
                sinon.assert.calledWithMatch(spy, sinon.match([1, undefined, undefined]));

                ctx.progress(1, 1);

                sinon.assert.calledTwice(spy);
                sinon.assert.calledWithMatch(spy, sinon.match([1, 1, undefined]));

                ctx.progress(2, 1);

                sinon.assert.calledThrice(spy);
                sinon.assert.calledWithMatch(spy, sinon.match([1, 1, 1]));
            });

            it("should report progresses of each inner ProgressPromises and undefined for others", () => {
                const
                    spy = sinon.spy(),
                    ctx = new ProgressContext(3).addFake(),
                    promise = promizr.ProgressPromise.all(ctx.promises()).progress(spy);

                ctx.progress(0, 1);

                sinon.assert.calledOnce(spy);
                sinon.assert.calledWithMatch(spy, sinon.match([1, undefined, undefined, undefined]));

                ctx.progress(1, 1);

                sinon.assert.calledTwice(spy);
                sinon.assert.calledWithMatch(spy, sinon.match([1, 1, undefined, undefined]));

                ctx.progress(2, 1);

                sinon.assert.calledThrice(spy);
                sinon.assert.calledWithMatch(spy, sinon.match([1, 1, 1, undefined]));
            });

        });

        describe("race", () => {

            it("should return an instance of ProgressPromise", () => {
                const result = promizr.ProgressPromise.race([]);
                result.should.be.instanceOf(promizr.ProgressPromise);
            });

            it("should report progresses of each inner ProgressPromises", () => {
                const
                    spy = sinon.spy(),
                    ctx = new ProgressContext(3),
                    promise = promizr.ProgressPromise.race(ctx.promises()).progress(spy);

                ctx.progress(0, 1);

                sinon.assert.calledOnce(spy);
                sinon.assert.calledWithMatch(spy, sinon.match([1, undefined, undefined]));

                ctx.progress(1, 1);

                sinon.assert.calledTwice(spy);
                sinon.assert.calledWithMatch(spy, sinon.match([1, 1, undefined]));

                ctx.progress(2, 1);

                sinon.assert.calledThrice(spy);
                sinon.assert.calledWithMatch(spy, sinon.match([1, 1, 1]));
            });

            it("should report progresses of each inner ProgressPromises and undefined for others", () => {
                const
                    spy = sinon.spy(),
                    ctx = new ProgressContext(3).addFake(),
                    promise = promizr.ProgressPromise.race(ctx.promises()).progress(spy);

                ctx.progress(0, 1);

                sinon.assert.calledOnce(spy);
                sinon.assert.calledWithMatch(spy, sinon.match([1, undefined, undefined, undefined]));

                ctx.progress(1, 1);

                sinon.assert.calledTwice(spy);
                sinon.assert.calledWithMatch(spy, sinon.match([1, 1, undefined, undefined]));

                ctx.progress(2, 1);

                sinon.assert.calledThrice(spy);
                sinon.assert.calledWithMatch(spy, sinon.match([1, 1, 1, undefined]));
            });

        });

    });

});
