jest.useFakeTimers();

import { setImmediate as pSetImmediate } from "../lib/setImmediate";

describe("promizr.setImmediate()", () => {

    test("should return call setImmediate on NodeJS", () => {
        const callback = jest.fn();
        pSetImmediate(callback);

        expect(setImmediate).toHaveBeenCalledTimes(1);
        expect(setImmediate).toHaveBeenCalledWith(callback);

        expect(callback).not.toHaveBeenCalled();

        jest.runAllImmediates();

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith();
    });

});
