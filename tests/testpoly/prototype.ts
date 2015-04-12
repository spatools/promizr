/// <reference path="tests.d.ts" />

import abstract = require("polyfill/abstract");
import Promise = require("polyfill/class");
import tasks = require("polyfill/tasks");
import reactionsHelpers = require("./helpers/reactions");
import commonHelpers = require("./helpers/common");

describe("Promise Prototype", () => {
    describe("then", () => {

        it("should call CreateResolutionHandlerFunction Abstract Operation with promise and both callbacks", () => {
            var promise = new Promise(commonHelpers.noop()),
                resolveHandler = commonHelpers.noop(), rejectHandler = commonHelpers.noop(),
                createResolutionHandlerStub = sinon.stub(abstract, "createResolutionHandlerFunction");

            promise.then(resolveHandler, rejectHandler);

            sinon.assert.calledOnce(createResolutionHandlerStub);
            sinon.assert.calledWithExactly(createResolutionHandlerStub, promise, resolveHandler, rejectHandler);

            createResolutionHandlerStub.restore();
        });

        describe("when [[Status]] internal slot is 'unresolved'", () => {

            it("should create a PromiseReaction for both callbacks with a common capability", () => {
                var promise = new Promise(commonHelpers.noop());

                promise.then(undefined, undefined);

                promise._resolveReactions.length.should.equal(1);
                promise._rejectReactions.length.should.equal(1);

                promise._resolveReactions[0].capability.should.equal(promise._rejectReactions[0].capability);
            });

            it("should create a PromiseReaction with given reject callback as handler", () => {
                var promise = new Promise(commonHelpers.noop()),
                    rejectHanler = commonHelpers.noop();

                promise.then(undefined, rejectHanler);

                promise._resolveReactions.length.should.equal(1);
                promise._rejectReactions.length.should.equal(1);

                promise._rejectReactions[0].handler.should.equal(rejectHanler);
            });
        });

        describe("when [[Status]] internal slot is 'has-resolution'", () => {

            it("should call enqueueTask with PromiseReactionTask", () => {
                var expectedResolution = { value: "Yoopie!" },

                    promise = new Promise(resolve => { resolve(expectedResolution); }),
                    enqueueTaskStub = sinon.stub(tasks, "enqueue");

                promise._status.should.equal("has-resolution");

                promise.then(undefined, undefined);

                sinon.assert.calledOnce(enqueueTaskStub);
                sinon.assert.calledWith(enqueueTaskStub, abstract.PromiseReactionTask);

                enqueueTaskStub.restore();
            });

        });

        describe("when [[Status]] internal slot is 'has-rejection'", () => {

            it("should call enqueueTask with PromiseReactionTask", () => {
                var expectedReason = new Error("an error"),

                    promise = new Promise((resolve, reject) => { reject(expectedReason); }),
                    enqueueTaskStub = sinon.stub(tasks, "enqueue");

                promise._status.should.equal("has-rejection");

                promise.then(undefined, undefined);

                sinon.assert.calledOnce(enqueueTaskStub);
                sinon.assert.calledWith(enqueueTaskStub, abstract.PromiseReactionTask);

                enqueueTaskStub.restore();
            });

        });

    });

    describe("catch", () => {

        it("should call then with [undefined, onRejected] as arguments", () => {
            var promise = new Promise(commonHelpers.noop()),
                rejectHandler = commonHelpers.noop(),
                thenStub = sinon.stub(promise, "then");

            promise.catch(rejectHandler);

            sinon.assert.calledOnce(thenStub);
            sinon.assert.calledWithExactly(thenStub, undefined, rejectHandler);
        });

    });
});
