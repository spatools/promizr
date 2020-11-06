import PriorityTaskQueue from "../lib/PriorityTaskQueue";
import PriorityQueue from "../lib/Queue";

import timeout from "./helpers/timeout";

describe("promizr.PriorityTaskQueue", () => {

    test("should extends PriorityQueue", () => {
        const queue = new PriorityTaskQueue(3);
        expect(queue).toBeInstanceOf(PriorityTaskQueue);
        expect(queue).toBeInstanceOf(PriorityQueue);
    });

    test("should call the task passed as items", async () => {
        const queue = new PriorityTaskQueue(3);

        const spies = [
            jest.fn(() => timeout(5)),
            jest.fn(() => timeout(1)),
            jest.fn(() => timeout(10)),
            jest.fn(() => timeout(8)),
            jest.fn(() => timeout(15))
        ];

        await queue.push(spies);

        for (const spy of spies) {
            expect(spy).toHaveBeenCalledTimes(1);
        }
    });

});
