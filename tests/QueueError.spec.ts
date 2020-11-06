import QueueError from "../lib/QueueError";

describe("promizr.QueueError", () => {

    test("should correctly extends Error", () => {
        const err = new QueueError([], []);
        expect(err).toBeInstanceOf(QueueError);
        expect(err).toBeInstanceOf(Error);
    });

});
