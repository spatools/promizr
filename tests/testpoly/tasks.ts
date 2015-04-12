/// <reference path="tests.d.ts" />

import tasks = require("polyfill/tasks");

describe("Promise Task Queue", () => {

    describe("enqueue", () => {
        beforeEach(() => { tasks.clear(); });

        it("should enqueue given function but does not call it while thread is busy", () => {
            var callback = sinon.spy();

            tasks.enqueue(callback, []);

            sinon.assert.notCalled(callback);
        });

        it("should call function when thread is released", (done) => {
            var callback = sinon.spy();

            tasks.enqueue(callback, []);

            sinon.assert.notCalled(callback);

            setTimeout(() => {
                sinon.assert.calledOnce(callback);
                done();
            }, 1);
        });

        it("should call function with given arguments", (done) => {
            var callback = sinon.spy(),
                arg1 = "argument1",
                arg2 = { value: "argument2" };

            tasks.enqueue(callback, [arg1, arg2]);

            sinon.assert.notCalled(callback);

            setTimeout(() => {
                sinon.assert.calledOnce(callback);
                sinon.assert.calledWithExactly(callback, arg1, arg2);

                done();
            }, 1);
        });

        it("should call all callbacks when thread is released", (done) => {
            var callback = sinon.spy(),
                callback2 = sinon.spy();

            tasks.enqueue(callback, []);
            tasks.enqueue(callback2, []);

            sinon.assert.notCalled(callback);
            sinon.assert.notCalled(callback2);

            setTimeout(() => {
                sinon.assert.calledOnce(callback);
                sinon.assert.calledOnce(callback2);

                done();
            }, 1);
        });

    });

});
