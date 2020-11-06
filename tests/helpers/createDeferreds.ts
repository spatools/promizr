import type { Deferred } from "../../lib/_types";

import defer from "../../lib/defer";

import timeout from "./timeout";

export default function createDeferreds<T>(list: T[]): Array<Deferred<void>> {
    return list.map(() => {
        const dfd = defer<void>();
        dfd.promise = dfd.promise.then(() => timeout(1));

        return dfd;
    });
}
