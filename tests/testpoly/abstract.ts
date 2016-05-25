/// <reference path="tests.d.ts" />

import * as sinon from "sinon";
import * as abstract from "polyfill/abstract";
import * as tasks from "polyfill/tasks";
import * as commonHelpers from "./helpers/common";
import * as reactionsHelpers from "./helpers/reactions";
import Promise = require("polyfill/class");
import FakePromise = require("./helpers/fake-promise");

describe("Promise Abstract Operation", () => {

    describe("createRejectFunction", () => {

        it("should return a function which accepts a single reason argument", () => {
            var promise = Object.create(Promise),
                rejectFunction = abstract.createRejectFunction(promise);

            rejectFunction.should.be.type("function");
            rejectFunction.length.should.be.equal(1);
        });

        describe("when called", () => {
            var triggerPromiseReactionStub: sinon.SinonStub;
            beforeEach(() => { triggerPromiseReactionStub = sinon.stub(abstract, "triggerPromiseReaction"); });
            afterEach(() => { triggerPromiseReactionStub.restore(); });

            it("should set Promise's [[Status]] internal slot to 'has-rejection'", () => {
                var promise = new Promise(commonHelpers.noop()),
                    rejectFunction = abstract.createRejectFunction(promise);

                rejectFunction.call(undefined);

                promise._status.should.equal("has-rejection");
            });

            it("should set Promise's [[Result]] internal slot to given reason", () => {
                var promise = new Promise(commonHelpers.noop()),
                    rejectFunction = abstract.createRejectFunction(promise),
                    expectedReason = new Error("some reason");

                rejectFunction.call(undefined, expectedReason);

                promise._result.should.equal(expectedReason);
            });

            it("should set Promise's [[ResolveReactions]] and [[RejectReactions]] internal slots to undefined", () => {
                var promise = new Promise(commonHelpers.noop()),
                    rejectFunction = abstract.createRejectFunction(promise);

                rejectFunction.call(undefined);

                commonHelpers.isUndefined(promise._resolveReactions).should.be.ok;
                commonHelpers.isUndefined(promise._rejectReactions).should.be.ok;
            });

            // Fails since Typescript 1.4 because exported functions are now called internally in functions so stub does not works
            //it("should call TriggerPromiseReaction Abstract Operation once with [[RejectReactions]] internal slot and given reason as arguments", () => {
            //    var promise = new Promise(commonHelpers.noop()),
            //        rejectFunction = abstract.createRejectFunction(promise),

            //        expectedReactions = promise._rejectReactions,
            //        expectedReason = new Error("some reason");

            //    rejectFunction.call(undefined, expectedReason);

            //    sinon.assert.calledOnce(triggerPromiseReactionStub);
            //    sinon.assert.calledWithExactly(triggerPromiseReactionStub, expectedReactions, expectedReason);
            //});
        });
    });

    describe("createResolveFunction", () => {

        it("should return a function which accepts a single resolution argument", () => {
            var promise = Object.create(Promise),
                resolveFunction = abstract.createResolveFunction(promise);

            resolveFunction.should.be.type("function");
            resolveFunction.length.should.be.equal(1);
        });

        describe("when called", () => {
            var triggerPromiseReactionStub: sinon.SinonStub;
            beforeEach(() => { triggerPromiseReactionStub = sinon.stub(abstract, "triggerPromiseReaction"); });
            afterEach(() => { triggerPromiseReactionStub.restore(); });

            it("should set Promise's [[Status]] internal slot to 'has-resolution'", () => {
                var promise = new Promise(commonHelpers.noop()),
                    resolveFunction = abstract.createResolveFunction(promise);

                resolveFunction.call(undefined);

                promise._status.should.equal("has-resolution");
            });

            it("should set Promise's [[Result]] internal slot to given resolution", () => {
                var promise = new Promise(commonHelpers.noop()),
                    resolveFunction = abstract.createResolveFunction(promise),
                    expectedResolution = { value: "Yoopie !" };

                resolveFunction.call(undefined, expectedResolution);

                promise._result.should.equal(expectedResolution);
            });

            it("should set Promise's [[ResolveReactions]] and [[RejectReactions]] internal slots to undefined", () => {
                var promise = new Promise(commonHelpers.noop()),
                    resolveFunction = abstract.createResolveFunction(promise);

                resolveFunction.call(undefined);

                (typeof promise._resolveReactions === "undefined").should.be.ok;
                (typeof promise._rejectReactions === "undefined").should.be.ok;
            });

            // Fails since Typescript 1.4 because exported functions are now called internally in functions so stub does not works
            //it("should call TriggerPromiseReaction Abstract Operation once with [[RejectReactions]] internal slot and given reason as arguments", () => {
            //    var promise = new Promise(commonHelpers.noop()),
            //        resolveFunction = abstract.createResolveFunction(promise),

            //        expectedReactions = promise._rejectReactions,
            //        expectedResolution = { value: "Yoopie !" };

            //    resolveFunction.call(undefined, expectedResolution);

            //    sinon.assert.calledOnce(triggerPromiseReactionStub);
            //    sinon.assert.calledWithExactly(triggerPromiseReactionStub, expectedReactions, expectedResolution);
            //});
        });
    });

    describe("createResolutionHandlerFunction", () => {

        it("should return a function which accepts a single resolution argument", () => {
            var promise = Object.create(Promise),
                resolutionHandler = abstract.createResolutionHandlerFunction(promise, commonHelpers.noop(), commonHelpers.noop());

            resolutionHandler.should.be.type("function");
            resolutionHandler.length.should.be.equal(1);
        });

        describe("when called", () => {
            var triggerPromiseReactionStub: sinon.SinonStub;
            beforeEach(() => { triggerPromiseReactionStub = sinon.stub(abstract, "triggerPromiseReaction"); });
            afterEach(() => { triggerPromiseReactionStub.restore(); });

            it("should call reject callback with TypeError if resolution argument is input promise", () => {
                var promise = new Promise(commonHelpers.noop()),
                    rejectSpy = sinon.spy(),
                    resolutionHandler = abstract.createResolutionHandlerFunction(promise, commonHelpers.noop(), rejectSpy);

                resolutionHandler.call(undefined, promise);

                sinon.assert.calledOnce(rejectSpy);
                sinon.assert.calledWith(rejectSpy, sinon.match.instanceOf(TypeError));
            });

            it("should call fulfill callback with given resolution if not a thenable", () => {
                var promise = new Promise(commonHelpers.noop()),
                    resolveSpy = sinon.spy(),
                    expectedResolution = { value: "Yoopie!" },
                    resolutionHandler = abstract.createResolutionHandlerFunction(promise, resolveSpy, commonHelpers.noop());

                resolutionHandler.call(undefined, expectedResolution);

                sinon.assert.calledOnce(resolveSpy);
                sinon.assert.calledWithExactly(resolveSpy, expectedResolution);
            });

            it("should register callbacks to a new capability if given resolution is a thenable", () => {
                var promise = new Promise(commonHelpers.noop()),
                    resolveSpy = sinon.spy(),
                    thenable = { then: sinon.spy() },
                    resolutionHandler = abstract.createResolutionHandlerFunction(promise, resolveSpy, commonHelpers.noop());

                resolutionHandler.call(undefined, thenable);

                sinon.assert.calledOnce(thenable.then);
            });

        });
    });

    describe("newPromiseCapability", () => {

        it("should throw a TypeError if called using a non-Promise like constructor argument", () => {
            abstract.newPromiseCapability.bind(undefined).should.throw(TypeError);
            abstract.newPromiseCapability.bind(undefined, {}).should.throw(TypeError);
            abstract.newPromiseCapability.bind(undefined, commonHelpers.noop()).should.throw(TypeError);

            abstract.newPromiseCapability.bind(undefined, Promise).should.not.throw();
            abstract.newPromiseCapability.bind(undefined, FakePromise).should.not.throw();
        });

        it("should return a proper PromiseCapability object", () => {
            var capability = abstract.newPromiseCapability(Promise);

            capability.promise.should.have.property("then");

            capability.reject.should.be.type("function");
            capability.reject.length.should.equal(1);

            capability.resolve.should.be.type("function");
            capability.resolve.length.should.equal(1);
        });
    });

    describe("triggerPromiseReactions", () => {

        describe("should call task.enqueue for each given reactions", () => {
            var enqueueTaskStub: sinon.SinonStub;
            beforeEach(() => { enqueueTaskStub = sinon.stub(tasks, "enqueue"); });
            afterEach(() => { enqueueTaskStub.restore(); });

            it("", () => {
                var reactions = reactionsHelpers.createFakeReactions(3),
                    expectedResolution = { value: "Yoopie !" };

                abstract.triggerPromiseReaction(reactions, expectedResolution);

                sinon.assert.calledThrice(enqueueTaskStub);
            });

            it("using PromiseReactionTask executor as first argument", () => {
                var reactions = reactionsHelpers.createFakeReactions(3),
                    expectedResolution = { value: "Yoopie !" };

                abstract.triggerPromiseReaction(reactions, expectedResolution);

                sinon.assert.alwaysCalledWith(enqueueTaskStub, abstract.PromiseReactionTask);
            });

            it("using each reactions and expectedResolution as second argument", () => {
                var reactions = reactionsHelpers.createFakeReactions(3),
                    expectedResolution = { value: "Yoopie !" };

                abstract.triggerPromiseReaction(reactions, expectedResolution);

                sinon.assert.calledWith(enqueueTaskStub, abstract.PromiseReactionTask, [reactions[0], expectedResolution]);
                sinon.assert.calledWith(enqueueTaskStub, abstract.PromiseReactionTask, [reactions[1], expectedResolution]);
                sinon.assert.calledWith(enqueueTaskStub, abstract.PromiseReactionTask, [reactions[2], expectedResolution]);
            });
        });
    });

    describe("updatePromiseFromPotentialThenable", () => {

        it("should return false if given object does not contain a then function", () => {
            var capability = abstract.newPromiseCapability(Promise);

            abstract.updatePromiseFromPotentialThenable(null, capability).should.be.false;
            abstract.updatePromiseFromPotentialThenable(undefined, capability).should.be.false;
            abstract.updatePromiseFromPotentialThenable({}, capability).should.be.false;
            abstract.updatePromiseFromPotentialThenable({ then: {} }, capability).should.be.false;
            abstract.updatePromiseFromPotentialThenable({ then: "flux" }, capability).should.be.false;
        });

        it("should return true if contains a then function", () => {
            var capability = abstract.newPromiseCapability(Promise),
                thenable = {
                    then: commonHelpers.noop()
                };

            abstract.updatePromiseFromPotentialThenable(thenable, capability).should.be.true;
        });

        it("should return true if contains a then function even if it throws", () => {
            var capability = abstract.newPromiseCapability(Promise),
                thenable = {
                    then: () => { throw new Error("this is an error"); }
                };

            abstract.updatePromiseFromPotentialThenable(thenable, capability).should.be.true;
        });

        it("should reject capability if potential then function throws an error", () => {
            var capability = abstract.newPromiseCapability(Promise),
                capabilityRejectStub = sinon.stub(capability, "reject"),
                expectedError = new Error("this is an error"),
                thenable = {
                    then: () => { throw expectedError; }
                };

            abstract.updatePromiseFromPotentialThenable(thenable, capability).should.be.true;
            sinon.assert.calledOnce(capabilityRejectStub);
            sinon.assert.calledWithExactly(capabilityRejectStub, expectedError);
        });

    });

    describe("PromiseReactionTask", () => {

        it("should throws a TypeError if called using a misformated PromiseReaction", () => {
            abstract.PromiseReactionTask.bind(undefined).should.throw(TypeError);
            abstract.PromiseReactionTask.bind(undefined, null).should.throw(TypeError);
            abstract.PromiseReactionTask.bind(undefined, {}).should.throw(TypeError);
        });

        it("should reject capability's Promise if reaction handler returns capability's Promise", () => {
            var reaction = reactionsHelpers.createFakeReaction(),
                capabilityRejectStub = sinon.stub(reaction.capability, "reject");

            reaction.handler = () => { return reaction.capability.promise; };
            abstract.PromiseReactionTask(reaction, null);

            sinon.assert.calledOnce(capabilityRejectStub);
            sinon.assert.calledWith(capabilityRejectStub, sinon.match.instanceOf(TypeError));
        });

        it("should resolve capability's Promise if reaction handler returns a non-thenable result", () => {
            var reaction = reactionsHelpers.createFakeReaction(),
                expectedResolution = { value: "Yoopie !" },
                capabilityResolveStub = sinon.stub(reaction.capability, "resolve");

            reaction.handler = () => expectedResolution;
            abstract.PromiseReactionTask(reaction, null);

            sinon.assert.calledOnce(capabilityResolveStub);
            sinon.assert.calledWith(capabilityResolveStub, expectedResolution);
        });

        it("should not resolve capability's Promise if reaction handler returns a thenable result", () => {
            var reaction = reactionsHelpers.createFakeReaction(),
                thenable = { then: sinon.spy() },
                capabilityResolveStub = sinon.stub(reaction.capability, "resolve");

            reaction.handler = () => thenable;
            abstract.PromiseReactionTask(reaction, null);

            sinon.assert.notCalled(capabilityResolveStub);
        });

        it("should call thenable's then function if reaction handler returns a thenable result", () => {
            var reaction = reactionsHelpers.createFakeReaction(),
                thenable = { then: sinon.spy() },
                capabilityResolveStub = sinon.stub(reaction.capability, "resolve");

            reaction.handler = () => thenable;
            abstract.PromiseReactionTask(reaction, null);

            sinon.assert.notCalled(capabilityResolveStub);
            sinon.assert.calledOnce(thenable.then);
            sinon.assert.calledWithExactly(thenable.then, reaction.capability.resolve, reaction.capability.reject);
        });
    });
});
