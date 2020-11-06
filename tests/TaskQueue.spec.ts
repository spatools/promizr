import TaskQueue from "../lib/TaskQueue";
import Queue from "../lib/Queue";

import timeout from "./helpers/timeout";

describe("promizr.TaskQueue", () => {

    test("should extends Queue", () => {
        const queue = new TaskQueue(3);
        expect(queue).toBeInstanceOf(TaskQueue);
        expect(queue).toBeInstanceOf(Queue);
    });

    test("should call the task passed as items", async () => {
        const queue = new TaskQueue(3);

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
