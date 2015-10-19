/// <reference path="tests.d.ts" />

import promizr = require("promizr");
import common = require("./helpers/common");

var list = [15, 1, 8],
    stopList = [251, 1, 50];

describe("Promizr Flow Methods", () => {

    describe("series function", () => {

        describe("whith a list argument", () => {

            it("should call each provided methods with given values in series", done => {
                var spy = sinon.spy(),
                    executors = list.map(num => () => promizr.timeout(num).then(() => spy(num)));

                promizr.series(executors).then(() => {
                    sinon.assert.calledThrice(spy);

                    spy.getCall(0).args[0].should.equal(list[0]);
                    spy.getCall(1).args[0].should.equal(list[1]);
                    spy.getCall(2).args[0].should.equal(list[2]);
                }).then(done, done);
            });

            it("should return an array with each values returned by executors", done => {
                var spy = sinon.spy(num => num * num),
                    executors = list.map(num => () => promizr.timeout(num).then(() => spy(num)));

                promizr.series(executors).then(results => {
                    sinon.assert.calledThrice(spy);

                    results.length.should.equal(3);
                    results[0].should.equal(list[0] * list[0]);
                    results[1].should.equal(list[1] * list[1]);
                    results[2].should.equal(list[2] * list[2]);
                }).then(done, done);
            });

            it("should stop if an executor throws", done => {
                var spy = sinon.spy(),

                    executors = list.map(num => sinon.spy(() => {
                        if (num === list[1]) {
                            return Promise.reject(common.testError);
                        }

                        return promizr.timeout(num).then(() => spy(num));
                    }));

                promizr.series(executors).catch<void>(e => {
                    e.should.equal(common.testError);

                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWithExactly(spy, list[0]);

                    sinon.assert.calledOnce(executors[0]);
                    sinon.assert.calledOnce(executors[1]);
                    sinon.assert.notCalled(executors[2]);
                }).then(done, done);
            });

        });

        describe("whith an object argument", () => {

            it("should call each provided methods with given values in series", done => {
                var spy = sinon.spy(),
                    executors = common.createExecutorObject(list, num => () => promizr.timeout(num).then(() => spy(num)));

                promizr.series(executors).then(() => {
                    sinon.assert.calledThrice(spy);

                    sinon.assert.calledWithExactly(spy, list[0]);
                    sinon.assert.calledWithExactly(spy, list[1]);
                    sinon.assert.calledWithExactly(spy, list[2]);

                }).then(done, done);
            });

            it("should return an object with each values returned by executors", done => {
                var spy = sinon.spy(num => num * num),
                    executors = common.createExecutorObject(list, num => () => promizr.timeout(num).then(() => spy(num)));

                promizr.series(executors).then(results => {
                    sinon.assert.calledThrice(spy);

                    Object.keys(results).length.should.equal(3);
                    results[list[0].toString()].should.equal(list[0] * list[0]);
                    results[list[1].toString()].should.equal(list[1] * list[1]);
                    results[list[2].toString()].should.equal(list[2] * list[2]);
                }).then(done, done);
            });

            it("should stop if an executor throws", done => {
                var spy = sinon.spy(),
                    count = 0,

                    executors = common.createExecutorObject(list, num => sinon.spy(() => {
                        if (count++ > 0) {
                            return Promise.reject(common.testError);
                        }

                        return promizr.timeout(num).then(() => spy(num));
                    }));

                promizr.series(executors).catch<void>(e => {
                    e.should.equal(common.testError);
                    sinon.assert.calledOnce(spy);
                }).then(done, done);
            });

        });

    });

    describe("parallel function", () => {

        describe("whith a list argument", () => {

            it("should call each provided methods with given values in parallel", done => {
                var spy = sinon.spy(),
                    executors = list.map(num => () => promizr.timeout(num).then(() => spy(num)));

                promizr.parallel(executors).then(() => {
                    sinon.assert.calledThrice(spy);

                    spy.getCall(0).args[0].should.equal(list[1]);
                    spy.getCall(1).args[0].should.equal(list[2]);
                    spy.getCall(2).args[0].should.equal(list[0]);
                }).then(done, done);
            });

            it("should return an array with each values returned by executors", done => {
                var spy = sinon.spy(num => num * num),
                    executors = list.map(num => () => promizr.timeout(num).then(() => spy(num)));

                promizr.parallel(executors).then(results => {
                    sinon.assert.calledThrice(spy);

                    results.length.should.equal(3);
                    results[0].should.equal(list[0] * list[0]);
                    results[1].should.equal(list[1] * list[1]);
                    results[2].should.equal(list[2] * list[2]);
                }).then(done, done);
            });

            it("should stop if an executor throws", done => {
                var spy = sinon.spy(),

                    executors = stopList.map(num => sinon.spy(() => {
                        return promizr.timeout(num).then(() => {
                            if (num === stopList[2]) {
                                return Promise.reject(common.testError);
                            }

                            spy(num);
                        });
                    }));

                promizr.parallel(executors).catch<void>(e => {
                    e.should.equal(common.testError);

                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWithExactly(spy, stopList[1]);

                    sinon.assert.calledOnce(executors[0]);
                    sinon.assert.calledOnce(executors[1]);
                    sinon.assert.calledOnce(executors[2]);
                }).then(done, done);
            });

        });

        describe("whith an object argument", () => {

            it("should call each provided methods with given values in parallel", done => {
                var spy = sinon.spy(),
                    executors = common.createExecutorObject(list, num => () => promizr.timeout(num).then(() => spy(num)));

                promizr.parallel(executors).then(() => {
                    sinon.assert.calledThrice(spy);

                    spy.getCall(0).args[0].should.equal(list[1]);
                    spy.getCall(1).args[0].should.equal(list[2]);
                    spy.getCall(2).args[0].should.equal(list[0]);
                }).then(done, done);
            });

            it("should return an object with each values returned by executors", done => {
                var spy = sinon.spy(num => num * num),
                    executors = common.createExecutorObject(list, num => () => promizr.timeout(num).then(() => spy(num)));

                promizr.parallel(executors).then(results => {
                    sinon.assert.calledThrice(spy);

                    Object.keys(results).length.should.equal(3);
                    results[list[0].toString()].should.equal(list[0] * list[0]);
                    results[list[1].toString()].should.equal(list[1] * list[1]);
                    results[list[2].toString()].should.equal(list[2] * list[2]);
                }).then(done, done);
            });

            it("should stop if an executor throws", done => {
                var spy = sinon.spy(),

                    executors = common.createExecutorObject(stopList, num => sinon.spy(() => {
                        return promizr.timeout(num).then(() => {
                            if (num === stopList[2]) {
                                return Promise.reject(common.testError);
                            }

                            spy(num);
                        });
                    }));

                promizr.parallel(executors).catch<void>(e => {
                    e.should.equal(common.testError);

                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWithExactly(spy, stopList[1]);

                    sinon.assert.calledOnce(<SinonSpy>executors[stopList[0].toString()]);
                    sinon.assert.calledOnce(<SinonSpy>executors[stopList[1].toString()]);
                    sinon.assert.calledOnce(<SinonSpy>executors[stopList[2].toString()]);
                }).then(done, done);
            });

        });

    });

    describe("whilst function", () => {

        it("should call provided method while given test pass", done => {
            var spy = sinon.spy(),
                i = 0,

                test = sinon.spy(() => list[i] % 2 !== 0),
                executor = () => {
                    var num = list[i++];
                    return promizr.timeout(num).then(() => spy(num));
                };

            promizr.whilst(test, executor).then(() => {
                sinon.assert.calledTwice(spy);
                sinon.assert.calledThrice(test);

                spy.getCall(0).args[0].should.equal(list[0]);
                spy.getCall(1).args[0].should.equal(list[1]);
            }).then(done, done);
        });

        it("should always call provided method after given test", done => {
            var i = 0,

                test = sinon.spy(() => list[i] % 2 !== 0),
                executor = sinon.spy(() => promizr.timeout(list[i++]));

            promizr.whilst(test, executor).then(() => {
                sinon.assert.calledTwice(executor);
                sinon.assert.calledThrice(test);

                executor.getCall(0).calledAfter(test.getCall(0)).should.be.ok;
                executor.getCall(1).calledAfter(test.getCall(1)).should.be.ok;
                executor.getCall(1).calledBefore(test.getCall(2)).should.be.ok;
            }).then(done, done);
        });

        it("should stop if an executor throws", done => {
            var spy = sinon.spy(),
                i = 0,

                test = sinon.spy(() => true),
                executor = sinon.spy(() => {
                    var num = list[i++];
                    if (num === list[1]) {
                        return Promise.reject(common.testError);
                    }

                    return promizr.timeout(num).then(() => spy(num));
                });

            promizr.whilst(test, executor).catch<void>(e => {
                e.should.equal(common.testError);

                sinon.assert.calledOnce(spy);
                sinon.assert.calledWithExactly(spy, list[0]);

                sinon.assert.calledTwice(test);
                sinon.assert.calledTwice(executor);
            }).then(done, done);
        });

    });

    describe("doWhilst function", () => {

        it("should call provided method while given test pass", done => {
            var spy = sinon.spy(num => num),
                i = 0,

                test = sinon.spy(res => res !== list[1]),
                executor = () => {
                    var num = list[i++];
                    return promizr.timeout(num).then(() => spy(num));
                };

            promizr.doWhilst(executor, test).then(() => {
                sinon.assert.calledTwice(spy);
                sinon.assert.calledTwice(test);

                spy.getCall(0).args[0].should.equal(list[0]);
                spy.getCall(1).args[0].should.equal(list[1]);
            }).then(done, done);
        });

        it("should pass the result of the task to the test function", done => {
            var spy = sinon.spy(num => num),
                i = 0,

                test = sinon.spy(res => res !== list[1]),
                executor = () => {
                    var num = list[i++];
                    return promizr.timeout(num).then(() => spy(num));
                };

            promizr.doWhilst(executor, test).then(() => {
                sinon.assert.calledTwice(spy);
                sinon.assert.calledTwice(test);

                test.getCall(0).args[0].should.equal(list[0]);
                test.getCall(1).args[0].should.equal(list[1]);
            }).then(done, done);
        });

        it("should always call provided method before given test", done => {
            var i = 0,
                test = sinon.spy(res => list[i++] !== list[1]),
                executor = sinon.spy(() => promizr.timeout(list[i]));

            promizr.doWhilst(executor, test).then(() => {
                sinon.assert.calledTwice(executor);
                sinon.assert.calledTwice(test);

                executor.getCall(0).calledBefore(test.getCall(0)).should.be.ok;
                executor.getCall(1).calledBefore(test.getCall(1)).should.be.ok;
            }).then(done, done);
        });

        it("should stop if an executor throws", done => {
            var spy = sinon.spy(),
                i = 0,

                test = sinon.spy(() => true),
                executor = sinon.spy(() => {
                    var num = list[i++];
                    if (num === list[1]) {
                        return Promise.reject(common.testError);
                    }

                    return promizr.timeout(num).then(() => spy(num));
                });

            promizr.doWhilst(executor, test).catch<void>(e => {
                e.should.equal(common.testError);

                sinon.assert.calledOnce(spy);
                sinon.assert.calledWithExactly(spy, list[0]);

                sinon.assert.calledOnce(test);
                sinon.assert.calledTwice(executor);
            }).then(done, done);
        });

    });

    describe("until function", () => {

        it("should call provided method while given test pass", done => {
            var spy = sinon.spy(),
                i = 0,

                test = sinon.spy(() => list[i] % 2 === 0),
                executor = () => {
                    var num = list[i++];
                    return promizr.timeout(num).then(() => spy(num));
                };

            promizr.until(test, executor).then(() => {
                sinon.assert.calledTwice(spy);
                sinon.assert.calledThrice(test);

                spy.getCall(0).args[0].should.equal(list[0]);
                spy.getCall(1).args[0].should.equal(list[1]);
            }).then(done, done);
        });

        it("should always call provided method after given test", done => {
            var i = 0,

                test = sinon.spy(() => list[i] % 2 === 0),
                executor = sinon.spy(() => promizr.timeout(list[i++]));

            promizr.until(test, executor).then(() => {
                sinon.assert.calledTwice(executor);
                sinon.assert.calledThrice(test);

                executor.getCall(0).calledAfter(test.getCall(0)).should.be.ok;
                executor.getCall(1).calledAfter(test.getCall(1)).should.be.ok;
                executor.getCall(1).calledBefore(test.getCall(2)).should.be.ok;
            }).then(done, done);
        });

        it("should stop if an executor throws", done => {
            var spy = sinon.spy(),
                i = 0,

                test = sinon.spy(() => false),
                executor = sinon.spy(() => {
                    var num = list[i++];
                    if (num === list[1]) {
                        return Promise.reject(common.testError);
                    }

                    return promizr.timeout(num).then(() => spy(num));
                });

            promizr.until(test, executor).catch<void>(e => {
                e.should.equal(common.testError);

                sinon.assert.calledOnce(spy);
                sinon.assert.calledWithExactly(spy, list[0]);

                sinon.assert.calledTwice(test);
                sinon.assert.calledTwice(executor);
            }).then(done, done);
        });

    });

    describe("doUntil function", () => {

        it("should call provided method while given test pass", done => {
            var spy = sinon.spy(num => num),
                i = 0,

                test = sinon.spy(res => res === list[1]),
                executor = () => {
                    var num = list[i++];
                    return promizr.timeout(num).then(() => spy(num));
                };

            promizr.doUntil(executor, test).then(() => {
                sinon.assert.calledTwice(spy);
                sinon.assert.calledTwice(test);

                spy.getCall(0).args[0].should.equal(list[0]);
                spy.getCall(1).args[0].should.equal(list[1]);
            }).then(done, done);
        });

        it("should pass the result of the task to the test function", done => {
            var spy = sinon.spy(num => num),
                i = 0,

                test = sinon.spy(res => res === list[1]),
                executor = () => {
                    var num = list[i++];
                    return promizr.timeout(num).then(() => spy(num));
                };

            promizr.doUntil(executor, test).then(() => {
                sinon.assert.calledTwice(spy);
                sinon.assert.calledTwice(test);

                test.getCall(0).args[0].should.equal(list[0]);
                test.getCall(1).args[0].should.equal(list[1]);
            }).then(done, done);
        });

        it("should always call provided method before given test", done => {
            var i = 0,
                test = sinon.spy(res => list[i++] === list[1]),
                executor = sinon.spy(() => promizr.timeout(list[i]));

            promizr.doUntil(executor, test).then(() => {
                sinon.assert.calledTwice(executor);
                sinon.assert.calledTwice(test);

                executor.getCall(0).calledBefore(test.getCall(0)).should.be.ok;
                executor.getCall(1).calledBefore(test.getCall(1)).should.be.ok;
            }).then(done, done);
        });

        it("should stop if an executor throws", done => {
            var spy = sinon.spy(),
                i = 0,

                test = sinon.spy(() => false),
                executor = sinon.spy(() => {
                    var num = list[i++];
                    if (num === list[1]) {
                        return Promise.reject(common.testError);
                    }

                    return promizr.timeout(num).then(() => spy(num));
                });

            promizr.doUntil(executor, test).catch<void>(e => {
                e.should.equal(common.testError);

                sinon.assert.calledOnce(spy);
                sinon.assert.calledWithExactly(spy, list[0]);

                sinon.assert.calledOnce(test);
                sinon.assert.calledTwice(executor);
            }).then(done, done);
        });

    });

    describe("forever function", () => {

        it("should call the method until forever until it throws", done => {
            var i = 0,
                spy = sinon.spy(() => {
                    if (i === 2) {
                        throw common.testError;
                    }

                    return promizr.timeout(i++);
                });

            promizr.forever(spy).catch<void>(() => {
                sinon.assert.calledThrice(spy);
            }).then(done, done);
        });

    });

    describe("waterfall function", () => {

        it("should call each task with previous task result as argument", done => {
            var spy = sinon.spy((a, b) => a + b),
                executors = list.map(a => b => promizr.timeout(a).then(() => spy(a, b || 0)));

            promizr.waterfall(executors).then(() => {
                sinon.assert.calledThrice(spy);

                spy.getCall(0).args[0].should.equal(list[0]);
                spy.getCall(1).args[0].should.equal(list[1]);
                spy.getCall(2).args[0].should.equal(list[2]);

                spy.getCall(0).args[1].should.equal(0);
                spy.getCall(1).args[1].should.equal(list[0]);
                spy.getCall(2).args[1].should.equal(list[0] + list[1]);
            }).then(done, done);
        });

        it("should return the result of the last task", done => {
            var spy = sinon.spy((a, b) => a + b),
                executors = list.map(a => b => promizr.timeout(a).then(() => spy(a, b || 0)));

            promizr.waterfall(executors).then(result => {
                result.should.equal(list[0] + list[1] + list[2]);
            }).then(done, done);
        });

        it("should stop if an executor throws", done => {
            var spy = sinon.spy(),
                i = 0,

                executors = list.map(num => sinon.spy(() => {
                    if (i++ === 1) {
                        return Promise.reject(common.testError);
                    }

                    return promizr.timeout(num).then(() => spy(num));
                }));

            promizr.waterfall(executors).catch<void>(e => {
                e.should.equal(common.testError);

                sinon.assert.calledOnce(spy);
                sinon.assert.calledWithExactly(spy, list[0]);

                sinon.assert.calledOnce(executors[0]);
                sinon.assert.calledOnce(executors[1]);
                sinon.assert.notCalled(executors[2]);
            }).then(done, done);
        });

    });

    describe("compose function", () => {

        it("should return a promised function which should transfer its arguments and owner to the last given task", done => {
            var task = sinon.spy((...args: number[]) => args.reduce((a, b) => a + b, 0)),
                owner = {};

            var fn = promizr.compose(task);

            sinon.assert.notCalled(task);

            fn.apply(owner, list).then(result => {
                sinon.assert.calledOnce(task);
                sinon.assert.calledWithExactly(task, list[0], list[1], list[2]);
                sinon.assert.calledOn(task, owner);
            }).then(done, done);
        });

        describe("when result called", () => {

            it("should call each task with previous task result as argument", done => {
                var spy = sinon.spy((a, b) => a + b),
                    executors = list.map(a => b => promizr.timeout(a).then(() => spy(a, b)));

                promizr.compose.apply(null, executors)(0).then(() => {
                    sinon.assert.calledThrice(spy);

                    spy.getCall(0).args[0].should.equal(list[2]);
                    spy.getCall(1).args[0].should.equal(list[1]);
                    spy.getCall(2).args[0].should.equal(list[0]);

                    spy.getCall(0).args[1].should.equal(0);
                    spy.getCall(1).args[1].should.equal(list[2]);
                    spy.getCall(2).args[1].should.equal(list[2] + list[1]);
                }).then(done, done);
            });

            it("should return the result of the first given task", done => {
                var task = sinon.spy((...args: number[]) => args.reduce((a, b) => a + b, 0)),
                    owner = {};

                promizr.compose(task).apply(owner, list).then(result => {
                    result.should.equal(list[0] + list[1] + list[2]);
                }).then(done, done);
            });

            it("should stop if an executor throws", done => {
                var spy = sinon.spy(),
                    i = 0,

                    executors = list.map(num => sinon.spy(() => {
                        if (i++ === 1) {
                            return Promise.reject(common.testError);
                        }

                        return promizr.timeout(num).then(() => spy(num));
                    }));

                promizr.compose.apply(null, executors)(0).catch(e => {
                    e.should.equal(common.testError);

                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWithExactly(spy, list[2]);

                    sinon.assert.calledOnce(executors[2]);
                    sinon.assert.calledOnce(executors[1]);
                    sinon.assert.notCalled(executors[0]);
                }).then(done, done);
            });

        });

    });

    describe("seq function", () => {

        it("should return a promised function which should transfer its arguments and owner to the first given task", done => {
            var task = sinon.spy((...args: number[]) => args.reduce((a, b) => a + b, 0)),
                owner = {};

            var fn = promizr.seq(task);

            sinon.assert.notCalled(task);

            fn.apply(owner, list).then(result => {
                sinon.assert.calledOnce(task);
                sinon.assert.calledWithExactly(task, list[0], list[1], list[2]);
                sinon.assert.calledOn(task, owner);
            }).then(done, done);
        });

        describe("when result called", () => {

            it("should call each task with previous task result as argument", done => {
                var spy = sinon.spy((a, b) => a + b),
                    executors = list.map(a => b => promizr.timeout(a).then(() => spy(a, b)));

                promizr.seq.apply(null, executors)(0).then(() => {
                    sinon.assert.calledThrice(spy);

                    spy.getCall(0).args[0].should.equal(list[0]);
                    spy.getCall(1).args[0].should.equal(list[1]);
                    spy.getCall(2).args[0].should.equal(list[2]);

                    spy.getCall(0).args[1].should.equal(0);
                    spy.getCall(1).args[1].should.equal(list[0]);
                    spy.getCall(2).args[1].should.equal(list[0] + list[1]);
                }).then(done, done);
            });

            it("should return the result of the last task", done => {
                var task = sinon.spy((...args: number[]) => args.reduce((a, b) => a + b, 0)),
                    owner = {};

                promizr.seq(task).apply(owner, list).then(result => {
                    result.should.equal(list[0] + list[1] + list[2]);
                }).then(done, done);
            });

            it("should stop if an executor throws", done => {
                var spy = sinon.spy(),
                    i = 0,

                    executors = list.map(num => sinon.spy(() => {
                        if (i++ === 1) {
                            return Promise.reject(common.testError);
                        }

                        return promizr.timeout(num).then(() => spy(num));
                    }));

                promizr.seq.apply(null, executors)(0).catch(e => {
                    e.should.equal(common.testError);

                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWithExactly(spy, list[0]);

                    sinon.assert.calledOnce(executors[0]);
                    sinon.assert.calledOnce(executors[1]);
                    sinon.assert.notCalled(executors[2]);
                }).then(done, done);
            });

        });

    });

    describe("applyEach function", () => {

        describe("whith a list of arguments", () => {

            it("should call each provided methods with given arguments in parallel", done => {
                var spy = sinon.spy(),
                    executors = list.map(num => (arg) => promizr.timeout(num).then(() => spy(num, arg)));

                (<Promise<any>>promizr.applyEach(executors, list)).then(() => {
                    sinon.assert.calledThrice(spy);

                    spy.getCall(0).args[0].should.equal(list[1]);
                    spy.getCall(1).args[0].should.equal(list[2]);
                    spy.getCall(2).args[0].should.equal(list[0]);

                    sinon.assert.alwaysCalledWithMatch(spy, sinon.match.number, sinon.match.same(list));
                }).then(done, done);
            });

            it("should return an array with each values returned by executors", done => {
                var spy = sinon.spy(num => num * num),
                    executors = list.map(num => () => promizr.timeout(num).then(() => spy(num)));

                (<Promise<any>>promizr.applyEach(executors, list)).then(results => {
                    sinon.assert.calledThrice(spy);

                    results.length.should.equal(3);
                    results[0].should.equal(list[0] * list[0]);
                    results[1].should.equal(list[1] * list[1]);
                    results[2].should.equal(list[2] * list[2]);
                }).then(done, done);
            });

            it("should stop if an executor throws", done => {
                var spy = sinon.spy(),

                    executors = stopList.map(num => sinon.spy(() => {
                        return promizr.timeout(num).then(() => {
                            if (num === stopList[2]) {
                                return Promise.reject(common.testError);
                            }

                            spy(num);
                        });
                    }));

                (<Promise<any>>promizr.applyEach(executors, stopList)).catch<void>(e => {
                    e.should.equal(common.testError);

                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWithExactly(spy, stopList[1]);

                    sinon.assert.calledOnce(executors[0]);
                    sinon.assert.calledOnce(executors[1]);
                    sinon.assert.calledOnce(executors[2]);
                }).then(done, done);
            });

        });

        describe("whith no arguments", () => {

            it("should return a promised function which should transfer its arguments to all tasks", done => {
                var spy = sinon.spy(() => promizr.timeout(1)),
                    executors = [spy, spy, spy],
                    owner = {};

                var fn = <promizr.PromiseTaskExecutor<any>>promizr.applyEach(executors);

                sinon.assert.notCalled(spy);

                fn.apply(owner, list).then(result => {
                    sinon.assert.calledThrice(spy);
                    sinon.assert.alwaysCalledWithExactly(spy, list[0], list[1], list[2]);
                    sinon.assert.alwaysCalledOn(spy, owner);
                }).then(done, done);
            });

        });

    });

    describe("applyEachSeries function", () => {

        describe("whith a list of arguments", () => {

            it("should call each provided methods with given values in series", done => {
                var spy = sinon.spy(),
                    executors = list.map(num => (arg) => promizr.timeout(num).then(() => spy(num, arg)));

                (<Promise<any>>promizr.applyEachSeries(executors, list)).then(() => {
                    sinon.assert.calledThrice(spy);

                    spy.getCall(0).args[0].should.equal(list[0]);
                    spy.getCall(1).args[0].should.equal(list[1]);
                    spy.getCall(2).args[0].should.equal(list[2]);

                    sinon.assert.alwaysCalledWithMatch(spy, sinon.match.number, sinon.match.same(list));
                }).then(done, done);
            });

            it("should return an array with each values returned by executors", done => {
                var spy = sinon.spy(num => num * num),
                    executors = list.map(num => () => promizr.timeout(num).then(() => spy(num)));

                (<Promise<any>>promizr.applyEachSeries(executors, list)).then(results => {
                    sinon.assert.calledThrice(spy);

                    results.length.should.equal(3);
                    results[0].should.equal(list[0] * list[0]);
                    results[1].should.equal(list[1] * list[1]);
                    results[2].should.equal(list[2] * list[2]);
                }).then(done, done);
            });

            it("should stop if an executor throws", done => {
                var spy = sinon.spy(),

                    executors = list.map(num => sinon.spy(() => {
                        if (num === list[1]) {
                            return Promise.reject(common.testError);
                        }

                        return promizr.timeout(num).then(() => spy(num));
                    }));

                (<Promise<any>>promizr.applyEachSeries(executors, list)).catch<void>(e => {
                    e.should.equal(common.testError);

                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWithExactly(spy, list[0]);

                    sinon.assert.calledOnce(executors[0]);
                    sinon.assert.calledOnce(executors[1]);
                    sinon.assert.notCalled(executors[2]);
                }).then(done, done);
            });

        });

        describe("whith no arguments", () => {

            it("should return a promised function which should transfer its arguments to all tasks", done => {
                var spy = sinon.spy(() => promizr.timeout(1)),
                    executors = [spy, spy, spy],
                    owner = {};

                var fn = <promizr.PromiseTaskExecutor<any>>promizr.applyEachSeries(executors);

                sinon.assert.notCalled(spy);

                fn.apply(owner, list).then(result => {
                    sinon.assert.calledThrice(spy);
                    sinon.assert.alwaysCalledWithExactly(spy, list[0], list[1], list[2]);
                    sinon.assert.alwaysCalledOn(spy, owner);
                }).then(done, done);
            });

        });

    });

    describe("retry function", () => {

        it("should retry function if failed", done => {
            var count = 0,
                spy = sinon.spy(() => {
                    if (count++ === 0) {
                        throw common.testError;
                    }
                });

            promizr.retry(5, spy).then(() => {
                sinon.assert.calledTwice(spy);
                count.should.equal(2);
            }).then(done, done);
        });

        it("should fail if function failed more than given times", done => {
            var count = 0,
                spy = sinon.spy(() => {
                    count++;
                    throw common.testError;
                });

            promizr.retry(5, spy).catch<void>(e => {
                e.should.equal(common.testError);
                sinon.assert.callCount(spy, 5);
                count.should.equal(5);
            }).then(done, done);
        });

    });

    describe("times function", () => {

        it("should call provided function a given number of times", done => {
            var count = 0,
                spy = sinon.spy(() => {
                    return list[count++];
                });

            promizr.times(3, spy).then(results => {
                sinon.assert.calledThrice(spy);
                count.should.equal(3);
            }).then(done, done);
        });

        it("should make all calls in parallel", done => {
            var count = 0,
                spy = sinon.spy(),
                task = () => {
                    var num = list[count++];
                    return promizr.timeout(num).then(() => spy(num));
                };

            promizr.times(3, task).then(results => {
                sinon.assert.calledThrice(spy);
                count.should.equal(3);

                spy.getCall(0).args[0].should.equal(list[1]);
                spy.getCall(1).args[0].should.equal(list[2]);
                spy.getCall(2).args[0].should.equal(list[0]);
            }).then(done, done);
        });

        it("should return an array with each values returned by tasks", done => {
            var count = 0,
                spy = sinon.spy(num => num * num),
                task = () => {
                    var num = list[count++];
                    return promizr.timeout(num).then(() => spy(num));
                };

            promizr.times(3, task).then(results => {
                sinon.assert.calledThrice(spy);

                results.length.should.equal(3);
                results[0].should.equal(list[0] * list[0]);
                results[1].should.equal(list[1] * list[1]);
                results[2].should.equal(list[2] * list[2]);
            }).then(done, done);
        });

        it("should stop if a task throws", done => {
            var count = 0,
                spy = sinon.spy(),

                task = sinon.spy(() => {
                    var num = stopList[count++];
                    return promizr.timeout(num).then(() => {
                        if (num === stopList[2]) {
                            return Promise.reject(common.testError);
                        }

                        spy(num);
                    });
                });

            promizr.times(3, task).catch<void>(e => {
                e.should.equal(common.testError);

                sinon.assert.calledOnce(spy);
                sinon.assert.calledWithExactly(spy, stopList[1]);

                sinon.assert.calledThrice(task);
            }).then(done, done);
        });

    });

    describe("timesSeries function", () => {

        it("should call provided function a given number of times", done => {
            var count = 0,
                spy = sinon.spy(() => {
                    return list[count++];
                });

            promizr.timesSeries(3, spy).then(results => {
                sinon.assert.calledThrice(spy);
                count.should.equal(3);
            }).then(done, done);
        });

        it("should make all calls in series", done => {
            var count = 0,
                spy = sinon.spy(),
                task = () => {
                    var num = list[count++];
                    return promizr.timeout(num).then(() => spy(num));
                };

            promizr.timesSeries(3, task).then(results => {
                sinon.assert.calledThrice(spy);
                count.should.equal(3);

                spy.getCall(0).args[0].should.equal(list[0]);
                spy.getCall(1).args[0].should.equal(list[1]);
                spy.getCall(2).args[0].should.equal(list[2]);
            }).then(done, done);
        });

        it("should return an array with each values returned by tasks", done => {
            var count = 0,
                spy = sinon.spy(num => num * num),
                task = () => {
                    var num = list[count++];
                    return promizr.timeout(num).then(() => spy(num));
                };

            promizr.timesSeries(3, task).then(results => {
                sinon.assert.calledThrice(spy);

                results.length.should.equal(3);
                results[0].should.equal(list[0] * list[0]);
                results[1].should.equal(list[1] * list[1]);
                results[2].should.equal(list[2] * list[2]);
            }).then(done, done);
        });

        it("should stop if a task throws", done => {
            var count = 0,
                spy = sinon.spy(),

                task = sinon.spy(() => {
                    var num = list[count++];
                    if (num === list[1]) {
                        return Promise.reject(common.testError);
                    }

                    return promizr.timeout(num).then(() => spy(num));
                });

            promizr.timesSeries(3, task).catch<void>(e => {
                e.should.equal(common.testError);

                sinon.assert.calledOnce(spy);
                sinon.assert.calledWithExactly(spy, list[0]);

                sinon.assert.calledTwice(task);
            }).then(done, done);
        });

    });

});
