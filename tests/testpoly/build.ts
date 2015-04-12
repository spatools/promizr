/// <reference path="tests.d.ts" />

import ImportedPromise = require("promise");
import PolyfillPromise = require("polyfill/class");
import common = require("./helpers/common");

describe("build polyfill", () => {

    it("should be accessible from AMD", () => {
        ImportedPromise.should.not.be.empty;
        common.isPromise(ImportedPromise);
        //ImportedPromise.should.be.exactly(PolyfillPromise);
    });

    it("should be accessible from Globals", () => {
        Promise.should.not.be.empty;
        common.isPromise(Promise);
        //Promise.should.be.exactly(PolyfillPromise);
    });

});
