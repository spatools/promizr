/// <reference path="tests.d.ts" />

import promizr = require("promizr");
import common = require("./helpers/common");

var list = [15, 1, 8];

describe("Promizr Collections Methods", () => {

    describe("each", () => {

        describe("parallel function", () => {

            it("should call each provided methods with given values in parallel", done => {
                var spy = sinon.spy(),
                    iterator = num => promizr.timeout(num).then(() => spy(num));

                promizr.each(list, iterator).then(() => {
                    sinon.assert.calledThrice(spy);

                    spy.getCall(0).args[0].should.equal(list[1]);
                    spy.getCall(1).args[0].should.equal(list[2]);
                    spy.getCall(2).args[0].should.equal(list[0]);
                }).then(done, done);
            });

            it("should stop if an iterator throws", done => {
                var spy = sinon.spy(),
                    err = new Error("test"),

                    iterator = sinon.spy(num => {
                        return promizr.timeout(num).then(() => {
                            if (num === list[2]) {
                                return Promise.reject(err);
                            }

                            spy(num);
                        });
                    });

                promizr.each(list, iterator).catch<void>(e => {
                    e.should.equal(err);

                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWithExactly(spy, list[1]);

                    sinon.assert.calledThrice(iterator);
                    sinon.assert.calledWithExactly(iterator, list[0], 0, list);
                    sinon.assert.calledWithExactly(iterator, list[1], 1, list);
                    sinon.assert.calledWithExactly(iterator, list[2], 2, list);
                }).then(done, done);
            });

        });

        describe("series function", () => {

            it("should call each provided methods with given values in series", done => {
                var spy = sinon.spy(),
                    iterator = num => promizr.timeout(num).then(() => spy(num));

                promizr.eachSeries(list, iterator).then(() => {
                    sinon.assert.calledThrice(spy);

                    spy.getCall(0).args[0].should.equal(list[0]);
                    spy.getCall(1).args[0].should.equal(list[1]);
                    spy.getCall(2).args[0].should.equal(list[2]);
                }).then(done, done);
            });

            it("should stop if an iterator throws", done => {
                var spy = sinon.spy(),
                    err = new Error("test"),

                    iterator = sinon.spy(num => {
                        if (num === list[1]) {
                            return Promise.reject(err);
                        }

                        return promizr.timeout(num).then(() => spy(num));
                    });

                promizr.eachSeries(list, iterator).catch<void>(e => {
                    e.should.equal(err);

                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWithExactly(spy, list[0]);

                    sinon.assert.calledTwice(iterator);
                    sinon.assert.calledWithExactly(iterator, list[0], 0, list);
                    sinon.assert.calledWithExactly(iterator, list[1], 1, list);
                }).then(done, done);
            });

        });

    });

    describe("map", () => {

        describe("parallel function", () => {

            it("should call each provided methods with given values in parallel", done => {
                var spy = sinon.spy(num => num * num),
                    iterator = num => promizr.timeout(num).then(() => spy(num));

                promizr.map(list, iterator).then(results => {
                    sinon.assert.calledThrice(spy);

                    spy.getCall(0).args[0].should.equal(list[1]);
                    spy.getCall(1).args[0].should.equal(list[2]);
                    spy.getCall(2).args[0].should.equal(list[0]);
                }).then(done, done);
            });

            it("should return mapped array with each values applied by iterator", done => {
                var spy = sinon.spy(num => num * num),
                    iterator = num => promizr.timeout(num).then(() => spy(num));

                promizr.map(list, iterator).then(results => {
                    sinon.assert.calledThrice(spy);

                    results.length.should.equal(3);
                    results[0].should.equal(list[0] * list[0]);
                    results[1].should.equal(list[1] * list[1]);
                    results[2].should.equal(list[2] * list[2]);
                }).then(done, done);
            });

            it("should stop if an iterator throws", done => {
                var spy = sinon.spy(num => num * num),
                    err = new Error("test"),

                    iterator = sinon.spy(num => {
                        return promizr.timeout(num).then(() => {
                            if (num === list[2]) {
                                return Promise.reject(err);
                            }

                            spy(num);
                        });
                    });

                promizr.map(list, iterator).catch<void>(e => {
                    e.should.equal(err);

                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWithExactly(spy, list[1]);

                    sinon.assert.calledThrice(iterator);
                    sinon.assert.calledWithExactly(iterator, list[0], 0, list);
                    sinon.assert.calledWithExactly(iterator, list[1], 1, list);
                    sinon.assert.calledWithExactly(iterator, list[2], 2, list);
                }).then(done, done);
            });

        });

        describe("series function", () => {

            it("should call each provided methods with given values in series", done => {
                var spy = sinon.spy(num => num * num),
                    iterator = num => promizr.timeout(num).then(() => spy(num));

                promizr.mapSeries(list, iterator).then(() => {
                    sinon.assert.calledThrice(spy);

                    spy.getCall(0).args[0].should.equal(list[0]);
                    spy.getCall(1).args[0].should.equal(list[1]);
                    spy.getCall(2).args[0].should.equal(list[2]);
                }).then(done, done);
            });

            it("should return mapped array with each values applied by iterator", done => {
                var spy = sinon.spy(num => num * num),
                    iterator = num => promizr.timeout(num).then(() => spy(num));

                promizr.mapSeries(list, iterator).then(results => {
                    sinon.assert.calledThrice(spy);

                    results.length.should.equal(3);
                    results[0].should.equal(list[0] * list[0]);
                    results[1].should.equal(list[1] * list[1]);
                    results[2].should.equal(list[2] * list[2]);
                }).then(done, done);
            });

            it("should stop if an iterator throws", done => {
                var spy = sinon.spy(num => num * num),
                    err = new Error("test"),
                    iterator = sinon.spy(num => {
                        if (num === list[1]) {
                            return Promise.reject(err);
                        }

                        return promizr.timeout(num).then(() => spy(num));
                    });

                promizr.mapSeries(list, iterator).catch<void>(e => {
                    e.should.equal(err);

                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWithExactly(spy, list[0]);

                    sinon.assert.calledTwice(iterator);
                    sinon.assert.calledWithExactly(iterator, list[0], 0, list);
                    sinon.assert.calledWithExactly(iterator, list[1], 1, list);
                }).then(done, done);
            });

        });

    });

    describe("filter", () => {

        describe("parallel function", () => {

            it("should call each provided methods with given values in parallel", done => {
                var spy = sinon.spy(num => num % 2 === 1),
                    iterator = num => promizr.timeout(num).then(() => spy(num));

                promizr.filter(list, iterator).then(results => {
                    sinon.assert.calledThrice(spy);

                    spy.getCall(0).args[0].should.equal(list[1]);
                    spy.getCall(1).args[0].should.equal(list[2]);
                    spy.getCall(2).args[0].should.equal(list[0]);
                }).then(done, done);
            });

            it("should return array with given values filtered by iterator", done => {
                var spy = sinon.spy(num => num % 2 === 1),
                    iterator = num => promizr.timeout(num).then(() => spy(num));

                promizr.filter(list, iterator).then(results => {
                    sinon.assert.calledThrice(spy);

                    results.length.should.equal(2);
                    results[0].should.equal(list[1]);
                    results[1].should.equal(list[0]);
                }).then(done, done);
            });

            it("should stop if an iterator throws", done => {
                var spy = sinon.spy(num => num % 2 === 1),
                    err = new Error("test"),

                    iterator = sinon.spy(num => {
                        return promizr.timeout(num).then(() => {
                            if (num === list[2]) {
                                return Promise.reject(err);
                            }

                            spy(num);
                        });
                    });

                promizr.filter(list, iterator).catch<void>(e => {
                    e.should.equal(err);

                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWithExactly(spy, list[1]);

                    sinon.assert.calledThrice(iterator);
                    sinon.assert.calledWithExactly(iterator, list[0], 0, list);
                    sinon.assert.calledWithExactly(iterator, list[1], 1, list);
                    sinon.assert.calledWithExactly(iterator, list[2], 2, list);
                }).then(done, done);
            });

        });

        describe("series function", () => {

            it("should call each provided methods with given values in series", done => {
                var spy = sinon.spy(num => num % 2 === 1),
                    iterator = num => promizr.timeout(num).then(() => spy(num));

                promizr.filterSeries(list, iterator).then(() => {
                    sinon.assert.calledThrice(spy);

                    spy.getCall(0).args[0].should.equal(list[0]);
                    spy.getCall(1).args[0].should.equal(list[1]);
                    spy.getCall(2).args[0].should.equal(list[2]);
                }).then(done, done);
            });

            it("should return array with given values filtered by iterator", done => {
                var spy = sinon.spy(num => num % 2 === 1),
                    iterator = num => promizr.timeout(num).then(() => spy(num));

                promizr.filterSeries(list, iterator).then(results => {
                    sinon.assert.calledThrice(spy);

                    results.length.should.equal(2);
                    results[0].should.equal(list[0]);
                    results[1].should.equal(list[1]);
                }).then(done, done);
            });

            it("should stop if an iterator throws", done => {
                var spy = sinon.spy(num => num % 2 === 1),
                    err = new Error("test"),
                    iterator = sinon.spy(num => {
                        if (num === list[1]) {
                            return Promise.reject(err);
                        }

                        return promizr.timeout(num).then(() => spy(num));
                    });

                promizr.filterSeries(list, iterator).catch<void>(e => {
                    e.should.equal(err);

                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWithExactly(spy, list[0]);

                    sinon.assert.calledTwice(iterator);
                    sinon.assert.calledWithExactly(iterator, list[0], 0, list);
                    sinon.assert.calledWithExactly(iterator, list[1], 1, list);
                }).then(done, done);
            });

        });

    });

    describe("reject", () => {

        describe("parallel function", () => {

            it("should call each provided methods with given values in parallel", done => {
                var spy = sinon.spy(num => num % 2 === 0),
                    iterator = num => promizr.timeout(num).then(() => spy(num));

                promizr.reject(list, iterator).then(results => {
                    sinon.assert.calledThrice(spy);

                    spy.getCall(0).args[0].should.equal(list[1]);
                    spy.getCall(1).args[0].should.equal(list[2]);
                    spy.getCall(2).args[0].should.equal(list[0]);
                }).then(done, done);
            });

            it("should return array with given values filtered by iterator", done => {
                var spy = sinon.spy(num => num % 2 === 0),
                    iterator = num => promizr.timeout(num).then(() => spy(num));

                promizr.reject(list, iterator).then(results => {
                    sinon.assert.calledThrice(spy);

                    results.length.should.equal(2);
                    results[0].should.equal(list[1]);
                    results[1].should.equal(list[0]);
                }).then(done, done);
            });

            it("should stop if an iterator throws", done => {
                var spy = sinon.spy(num => num % 2 === 0),
                    err = new Error("test"),

                    iterator = sinon.spy(num => {
                        return promizr.timeout(num).then(() => {
                            if (num === list[2]) {
                                return Promise.reject(err);
                            }

                            spy(num);
                        });
                    });

                promizr.reject(list, iterator).catch<void>(e => {
                    e.should.equal(err);

                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWithExactly(spy, list[1]);

                    sinon.assert.calledThrice(iterator);
                    sinon.assert.calledWithExactly(iterator, list[0], 0, list);
                    sinon.assert.calledWithExactly(iterator, list[1], 1, list);
                    sinon.assert.calledWithExactly(iterator, list[2], 2, list);
                }).then(done, done);
            });

        });

        describe("series function", () => {

            it("should call each provided methods with given values in series", done => {
                var spy = sinon.spy(num => num % 2 === 0),
                    iterator = num => promizr.timeout(num).then(() => spy(num));

                promizr.rejectSeries(list, iterator).then(() => {
                    sinon.assert.calledThrice(spy);

                    spy.getCall(0).args[0].should.equal(list[0]);
                    spy.getCall(1).args[0].should.equal(list[1]);
                    spy.getCall(2).args[0].should.equal(list[2]);
                }).then(done, done);
            });

            it("should return array with given values filtered by iterator", done => {
                var spy = sinon.spy(num => num % 2 === 0),
                    iterator = num => promizr.timeout(num).then(() => spy(num));

                promizr.rejectSeries(list, iterator).then(results => {
                    sinon.assert.calledThrice(spy);

                    results.length.should.equal(2);
                    results[0].should.equal(list[0]);
                    results[1].should.equal(list[1]);
                }).then(done, done);
            });

            it("should stop if an iterator throws", done => {
                var spy = sinon.spy(num => num % 2 === 0),
                    err = new Error("test"),
                    iterator = sinon.spy(num => {
                        if (num === list[1]) {
                            return Promise.reject(err);
                        }

                        return promizr.timeout(num).then(() => spy(num));
                    });

                promizr.rejectSeries(list, iterator).catch<void>(e => {
                    e.should.equal(err);

                    sinon.assert.calledOnce(spy);
                    sinon.assert.calledWithExactly(spy, list[0]);

                    sinon.assert.calledTwice(iterator);
                    sinon.assert.calledWithExactly(iterator, list[0], 0, list);
                    sinon.assert.calledWithExactly(iterator, list[1], 1, list);
                }).then(done, done);
            });

        });

    });

});