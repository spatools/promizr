export default class QueueError<T> extends Error {
    public innerErrors: Error[];
    public results: T[];

    constructor(innerErrors: Error[], results: T[]) {
        super("Errors occured while executing the Queue");

        this.name = this.constructor.name;

        if (Object.setPrototypeOf) {
            Object.setPrototypeOf(this, QueueError.prototype);
        }

        if ((<any>Error).captureStackTrace) {
            (<any>Error).captureStackTrace(this, this.constructor);
        }

        this.innerErrors = innerErrors;
        this.results = results;
    }
}
