/// <reference path="tests.d.ts" />

import promizr = require("promizr");
import common = require("./helpers/common");

const
    list = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15],
    total = list.length,
    limit = 3;

describe("Promizr Queue Methods", () => {

    describe("Queue class", () => {

        describe("constructor", () => {

            it("should not start queue if no list provided", done => {
                const
                    spy = sinon.spy(),
                    instance = new promizr.Queue(spy, limit);

                promizr.timeout(10).then(() => {
                    sinon.assert.notCalled(spy);
                }).then(done, done);
            });

            it("should start queue if list provided", done => {
                const
                    spy = sinon.spy(),
                    instance = new promizr.Queue(spy, limit, list);

                promizr.timeout(20).then(() => {
                    sinon.assert.callCount(spy, list.length);
                }).then(done, done);
            });

            it("should start queue asynchronously", () => {
                const
                    spy = sinon.spy(),
                    instance = new promizr.Queue(spy, limit, list);

                sinon.assert.notCalled(spy);
            });

        });

        describe("task limiting", () => {

            it("should only launch specified limit number of task simultaneously", done => {
                const
                    spy = sinon.spy(common.createPromise),
                    instance = new promizr.Queue(spy, limit, list);

                promizr.timeout(10).then(() => {
                    sinon.assert.callCount(spy, limit);
                }).then(done, done);
            });

            it("should continue to limit number of task simultaneously when promises are resolved", done => {
                const
                    dfds = common.createDeferreds(list),
                    spy = sinon.spy(n => dfds[n].promise),
                    instance = new promizr.Queue(spy, limit, list);

                sinon.assert.notCalled(spy);

                promizr.timeout(10)
                    .then(() => {
                        sinon.assert.callCount(spy, limit);

                        for (let i = 0, len = limit; i < len; i++) {
                            dfds[i].resolve();
                        }

                        return dfds[limit - 1].promise;
                    })
                    .then(() => promizr.timeout(5))
                    .then(() => {
                        sinon.assert.callCount(spy, limit * 2);

                        for (let i = limit, len = limit * 3; i < len; i++) {
                            dfds[i].resolve();
                        }

                        return dfds[limit * 2 - 1].promise;
                    })
                    .then(() => {
                        spy.callCount.should.be.below(limit * 3 + 1);
                        return dfds[limit * 3 - 1].promise;
                    })
                    .then(() => promizr.timeout())
                    .then(() => {
                        sinon.assert.callCount(spy, limit * 4);
                    })
                    .then(done, done);
            });

            it("should continue to execute works even if exception occurred", done => {
                const
                    err = new Error("This is an error !"),
                    dfds = common.createDeferreds(list),
                    spy = sinon.spy(n => dfds[n].promise),
                    instance = new promizr.Queue(spy, limit, list);

                sinon.assert.notCalled(spy);

                promizr.timeout(10)
                    .then(() => {
                        sinon.assert.callCount(spy, limit);

                        for (let i = 0, len = limit; i < len; i++) {
                            dfds[i].reject(err);
                        }

                        return dfds[limit - 1].promise.catch(common.noop);
                    })
                    .then(() => promizr.timeout())
                    .then(() => {
                        sinon.assert.callCount(spy, limit * 2);

                        for (let i = limit, len = limit * 2; i < len; i++) {
                            dfds[i].reject(err);
                        }

                        return dfds[limit * 2 - 1].promise.catch(common.noop);
                    })
                    .then(() => promizr.timeout())
                    .then(() => {
                        sinon.assert.callCount(spy, limit * 3);
                    })
                    .then(done, done);
            });

            it("should not continue to execute works if exception occurred and stopOnError is set to true", done => {
                const
                    err = new Error("This is an error !"),
                    dfds = common.createDeferreds(list),
                    spy = sinon.spy(n => dfds[n].promise),
                    instance = new promizr.Queue(spy, limit, list);

                sinon.assert.notCalled(spy);

                instance.stopOnError = true;

                promizr.timeout(10)
                    .then(() => {
                        sinon.assert.callCount(spy, limit);

                        for (let i = 0, len = limit; i < len; i++) {
                            dfds[i].reject(err);
                        }

                        return dfds[limit - 1].promise.catch(common.noop);
                    })
                    .then(() => {
                        sinon.assert.callCount(spy, limit);
                    })
                    .then(done, done);
            });

        });

        describe("push", () => {

            it("should return a promise which is resolved when all workers are done", done => {
                const
                    defer = promizr.defer(),
                    spy = sinon.spy(),
                    instance = new promizr.Queue(() => defer.promise, limit),

                    promise = instance.push(list).then(spy);

                promizr.timeout(10)
                    .then(() => {
                        sinon.assert.notCalled(spy);

                        defer.resolve();
                        return promise;
                    })
                    .then(() => {
                        sinon.assert.calledOnce(spy);
                    })
                    .then(done, done);
            });

            it("should resolve with an array containing results of each workers", done => {
                const instance = new promizr.Queue(common.identity, limit);

                instance.push(list).then(res => {
                    res.should.be.an.Array;
                    res.should.eql(list);
                    res.should.not.be.equal(list);
                }).then(done, done);
            });

            it("should resolve with only one item if only one item is passed to pushed function", done => {
                const instance = new promizr.Queue(common.identity, limit);

                instance.push(list[0]).then(res => {
                    res.should.not.be.an.Array;
                    res.should.equal(list[0]);
                }).then(done, done);
            });

            it("should reject immediately if any item reject", done => {
                const
                    spy = sinon.spy(n => Promise.reject(n)),
                    instance = new promizr.Queue(n => promizr.immediate().then(() => spy(n)), limit);

                instance.push(list).catch(err => {
                    sinon.assert.callCount(spy, limit);

                    err.should.equal(list[0]);
                }).then(done, done);
            });

            it("should wait to reject if waitToReject is set to true", done => {
                const
                    spy = sinon.spy(n => Promise.reject(n)),
                    instance = new promizr.Queue(n => promizr.immediate().then(() => spy(n)), limit);

                instance.waitToReject = true;

                instance.push(list).catch((err: promizr.QueueError) => {
                    sinon.assert.callCount(spy, total);

                    err.innerExceptions.should.eql(list);
                }).then(done, done);
            });

        });

    });

    describe("PriorityQueue class", () => {

        describe("constructor", () => {

            it("should not start queue if no list provided", done => {
                const
                    spy = sinon.spy(),
                    instance = new promizr.PriorityQueue(spy, limit);

                promizr.timeout(10).then(() => {
                    sinon.assert.notCalled(spy);
                }).then(done, done);
            });

            it("should start queue if list provided", done => {
                const
                    spy = sinon.spy(),
                    instance = new promizr.PriorityQueue(spy, limit, list);

                promizr.timeout(20).then(() => {
                    sinon.assert.callCount(spy, list.length);
                }).then(done, done);
            });

            it("should start queue asynchronously", () => {
                const
                    spy = sinon.spy(),
                    instance = new promizr.PriorityQueue(spy, limit, list);

                sinon.assert.notCalled(spy);
            });

        });

        describe("task limiting", () => {

            it("should only launch specified limit number of task simultaneously", done => {
                const
                    spy = sinon.spy(common.createPromise),
                    instance = new promizr.PriorityQueue(spy, limit, list);

                promizr.timeout(10).then(() => {
                    sinon.assert.callCount(spy, limit);
                }).then(done, done);
            });

            it("should continue to limit number of task simultaneously when promises are resolved", done => {
                const
                    dfds = common.createDeferreds(list),
                    spy = sinon.spy(n => dfds[n].promise),
                    instance = new promizr.PriorityQueue(spy, limit, list);

                sinon.assert.notCalled(spy);

                promizr.timeout(10)
                    .then(() => {
                        sinon.assert.callCount(spy, limit);

                        for (let i = 0, len = limit; i < len; i++) {
                            dfds[i].resolve();
                        }

                        return dfds[limit - 1].promise;
                    })
                    .then(() => promizr.timeout())
                    .then(() => {
                        sinon.assert.callCount(spy, limit * 2);

                        for (let i = limit, len = limit * 3; i < len; i++) {
                            dfds[i].resolve();
                        }

                        return dfds[limit * 2 - 1].promise;
                    })
                    .then(() => {
                        spy.callCount.should.be.below(limit * 3 + 1);
                        return dfds[limit * 3 - 1].promise;
                    })
                    .then(() => promizr.timeout())
                    .then(() => {
                        sinon.assert.callCount(spy, limit * 4);
                    })
                    .then(done, done);
            });

            it("should continue to execute works even if exception occurred", done => {
                const
                    err = new Error("This is an error !"),
                    dfds = common.createDeferreds(list),
                    spy = sinon.spy(n => dfds[n].promise),
                    instance = new promizr.PriorityQueue(spy, limit, list);

                sinon.assert.notCalled(spy);

                promizr.timeout(10)
                    .then(() => {
                        sinon.assert.callCount(spy, limit);

                        for (let i = 0, len = limit; i < len; i++) {
                            dfds[i].reject(err);
                        }

                        return dfds[limit - 1].promise.catch(common.noop);
                    })
                    .then(() => promizr.timeout())
                    .then(() => {
                        sinon.assert.callCount(spy, limit * 2);

                        for (let i = limit, len = limit * 2; i < len; i++) {
                            dfds[i].reject(err);
                        }

                        return dfds[limit * 2 - 1].promise.catch(common.noop);
                    })
                    .then(() => promizr.timeout())
                    .then(() => {
                        sinon.assert.callCount(spy, limit * 3);
                    })
                    .then(done, done);
            });

            it("should not continue to execute works if exception occurred and stopOnError is set to true", done => {
                const
                    err = new Error("This is an error !"),
                    dfds = common.createDeferreds(list),
                    spy = sinon.spy(n => dfds[n].promise),
                    instance = new promizr.PriorityQueue(spy, limit, list);

                sinon.assert.notCalled(spy);

                instance.stopOnError = true;

                promizr.timeout(10)
                    .then(() => {
                        sinon.assert.callCount(spy, limit);

                        for (let i = 0, len = limit; i < len; i++) {
                            dfds[i].reject(err);
                        }

                        return dfds[limit - 1].promise.catch(common.noop);
                    })
                    .then(() => {
                        sinon.assert.callCount(spy, limit);
                    })
                    .then(done, done);
            });

        });

        describe("task priority", () => {

            it("call tasks in priority order", done => {
                const
                    spy = sinon.spy(),
                    spy2 = sinon.spy(),
                    spy3 = sinon.spy(),
                    instance = new promizr.PriorityQueue(promizr.immediate, limit);

                Promise.all([
                    instance.push(5, list).then(spy),
                    instance.push(1, list).then(spy2),
                    instance.push(3, list).then(spy3)
                ]).then(() => {
                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledOnce(spy2);
                    sinon.assert.calledOnce(spy3);

                    spy2.calledBefore(spy).should.be.ok;
                    spy2.calledBefore(spy3).should.be.ok;

                    spy3.calledBefore(spy).should.be.ok;
                }).then(done, done);
            });

        });

        describe("push", () => {

            it("should return a promise which is resolved when all workers are done", done => {
                const
                    defer = promizr.defer(),
                    spy = sinon.spy(),
                    instance = new promizr.PriorityQueue(() => defer.promise, limit),

                    promise = instance.push(1, list).then(spy);

                promizr.timeout(10)
                    .then(() => {
                        sinon.assert.notCalled(spy);

                        defer.resolve();
                        return promise;
                    })
                    .then(() => {
                        sinon.assert.calledOnce(spy);
                    })
                    .then(done, done);
            });

            it("should resolve with an array containing results of each workers", done => {
                const instance = new promizr.PriorityQueue(common.identity, limit);

                instance.push(1, list).then(res => {
                    res.should.be.an.Array;
                    res.should.eql(list);
                    res.should.not.be.equal(list);
                }).then(done, done);
            });

            it("should resolve with only one item if only one item is passed to pushed function", done => {
                const instance = new promizr.PriorityQueue(common.identity, limit);

                instance.push(1, list[0]).then(res => {
                    res.should.not.be.an.Array;
                    res.should.equal(list[0]);
                }).then(done, done);
            });

            it("should reject immediately if any item reject", done => {
                const
                    spy = sinon.spy(n => Promise.reject(n)),
                    instance = new promizr.PriorityQueue(n => promizr.immediate().then(() => spy(n)), limit);

                instance.push(1, list).catch(err => {
                    sinon.assert.callCount(spy, limit);

                    err.should.equal(list[0]);
                }).then(done, done);
            });

            it("should wait to reject if waitToReject is set to true", done => {
                const
                    spy = sinon.spy(n => Promise.reject(n)),
                    instance = new promizr.PriorityQueue(n => promizr.immediate().then(() => spy(n)), limit);

                instance.waitToReject = true;

                instance.push(1, list).catch((err: promizr.QueueError) => {
                    sinon.assert.callCount(spy, total);

                    err.innerExceptions.should.eql(list);
                }).then(done, done);
            });

        });

    });

});
