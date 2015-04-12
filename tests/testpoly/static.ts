/// <reference path="tests.d.ts" />

import abstract = require("polyfill/abstract");
import Promise = require("polyfill/class");
import tasks = require("polyfill/tasks");
import FakePromise = require("./helpers/fake-promise");
import commonHelpers = require("./helpers/common");
import reactionsHelpers = require("./helpers/reactions");
import capabilitiesHelpers = require("./helpers/capabilities");

describe("Promise Static", () => {

    describe("all", () => {

        it("should return a Promise object", () => {
            var promise = Promise.all([]);

            abstract.isPromise(promise).should.be.ok;
            promise.then.should.be.type("function");
        });

        it("should return a resolved Promise object if array is empty", () => {
            var promise = Promise.all([]);

            promise._status.should.equal("has-resolution");
        });

        it("should return an unresolved Promise object if array is not empty", () => {
            var promise = Promise.all([
                new Promise(commonHelpers.noop())
            ]);

            promise._status.should.equal("unresolved");
        });

        it("should resolve Promise when every given Promises are fulfilled", (done) => {
            var capabilities = capabilitiesHelpers.createFakeCapabilities(3),
                promises = capabilitiesHelpers.extractPromisesFromCapabilities(capabilities),

                promise = Promise.all(promises);

            for (var i = 0; i < capabilities.length; i++) {
                promise._status.should.equal("unresolved");

                capabilities[i].resolve(undefined);
            }

            setTimeout(() => {
                promise._status.should.equal("has-resolution");
                done();
            }, 40);
        });

        it("should resolve Promise whenever any given Promises fails", (done) => {
            var capabilities = capabilitiesHelpers.createFakeCapabilities(3),
                promises = capabilitiesHelpers.extractPromisesFromCapabilities(capabilities),

                promise = Promise.all(promises);

            promise._status.should.equal("unresolved");

            capabilities[0].reject(new Error("an error"));

            setTimeout(() => {
                promise._status.should.equal("has-rejection");
                done();
            }, 10);
        });

    });

    describe("race", () => {

        it("should return a Promise object", () => {
            var promise = Promise.race([]);

            abstract.isPromise(promise).should.be.ok;
            promise.then.should.be.type("function");
        });

        it("should return an unresolved Promise object", () => {
            var promise = Promise.race([
                new Promise(commonHelpers.noop())
            ]);

            promise._status.should.equal("unresolved");
        });

        it("should resolve Promise whenever any given Promises are fulfilled", (done) => {
            var capabilities = capabilitiesHelpers.createFakeCapabilities(3),
                promises = capabilitiesHelpers.extractPromisesFromCapabilities(capabilities),

                promise = Promise.race(promises);

            capabilities[0].resolve(undefined);

            setTimeout(() => {
                promise._status.should.equal("has-resolution");
                done();
            }, 10);
        });

        it("should resolve Promise whenever any given Promises fails", (done) => {
            var capabilities = capabilitiesHelpers.createFakeCapabilities(3),
                promises = capabilitiesHelpers.extractPromisesFromCapabilities(capabilities),

                promise = Promise.race(promises);

            promise._status.should.equal("unresolved");

            capabilities[0].reject(new Error("an error"));

            setTimeout(() => {
                promise._status.should.equal("has-rejection");
                done();
            }, 10);
        });

    });

    describe("reject", () => {

        it("should return a new rejected Promise with given reason", () => {
            var expectedReason = new Error("an error"),
                promise = Promise.reject(expectedReason);

            promise._status.should.equal("has-rejection");
            promise._result.should.equal(expectedReason);
        });

    });

    describe("resolve", () => {

        it("should return a new resolved Promise with given resolution", () => {
            var expectedResolution = { value: "Yoopie!" },
                promise = Promise.resolve(expectedResolution);

            promise._status.should.equal("has-resolution");
            promise._result.should.equal(expectedResolution);
        });

    });
});
