/**
 * @public
 * 
 * An Error that is thrown when a Queue execution fails and `waitToReject` option is set to true.
 */
export default class QueueError<T> extends Error {
    public innerErrors: Error[];
    public results: T[];

    constructor(innerErrors: Error[], results: T[]) {
        super("Errors occured while executing the Queue");

        this.name = this.constructor.name;

        if (Object.setPrototypeOf) {
            Object.setPrototypeOf(this, QueueError.prototype);
        }

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }

        this.innerErrors = innerErrors;
        this.results = results;
    }
}
