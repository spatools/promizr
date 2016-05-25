/// <reference path="tests.d.ts" />

import * as sinon from "sinon";
import * as abstract from "polyfill/abstract";
import * as commonHelpers from "./helpers/common";
import Promise = require("polyfill/class");

describe("Promise Constructor", () => {
    var createResolveFunctionStub: sinon.SinonStub, createRejectFunctionStub: sinon.SinonStub;

    beforeEach(() => {
        createResolveFunctionStub = sinon.stub(abstract, "createResolveFunction");
        createRejectFunctionStub = sinon.stub(abstract, "createRejectFunction");
    });

    afterEach(() => {
        createResolveFunctionStub.restore();
        createRejectFunctionStub.restore();
    });

    it("should throws a TypeError if given argument is not a Function", () => {
        var P: any = Promise;
        (() => { new P({}); }).should.throw(TypeError);
        (() => { new P(null); }).should.throw(TypeError);
        (() => { new P("test"); }).should.throw(TypeError);
    });

    it("should throws a TypeError if not called using new keyword", () => {
        var P: any = Promise;
         (() => { P(null); }).should.throw(TypeError);
    });

    it("should set [[Status]] internal slot to 'unresolved'", () => {
        var promise = new Promise(commonHelpers.noop());

        promise._status.should.equal("unresolved");
    });

    it("should set [[ResolveReactions]] and [[RejectReactions]] internal slots to empty lists", () => {
        var promise = new Promise(commonHelpers.noop());

        promise._resolveReactions.should.eql([]);
        promise._rejectReactions.should.eql([]);
    });

    it("should call CreateResolveFunction and CreateRejectFunction Abstract Operations", () => {
        var promise = new Promise(commonHelpers.noop());

        sinon.assert.calledOnce(createResolveFunctionStub);
        sinon.assert.calledOnce(createRejectFunctionStub);
    });

    it("should call given executor with result of CreateResolveFunction and CreateRejectFunction Abstract Operations", () => {
        var executorSpy = sinon.spy(),
            rejectSpy = sinon.spy(),
            resolveSpy = sinon.spy();

        createResolveFunctionStub.returns(resolveSpy);
        createRejectFunctionStub.returns(rejectSpy);

        new Promise(executorSpy);

        sinon.assert.calledOnce(executorSpy);
        sinon.assert.calledWithExactly(executorSpy, resolveSpy, rejectSpy);
    });

    it("should call reject function if executor throws", () => {
        var rejectSpy = sinon.spy();

        createRejectFunctionStub.returns(rejectSpy);

        new Promise(() => { throw new Error("an error"); });

        sinon.assert.calledOnce(rejectSpy);
    });

});
