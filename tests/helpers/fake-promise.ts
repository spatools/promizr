class FakePromise {
    private _status = undefined;
    private _result = undefined;

    private _onFulfilled;
    private _onRejected;

    constructor(executor: (resolve, reject) => any) {
        executor(
            (value) => { this._onFulfilled && this._onFulfilled.call(undefined, value); },
            (reason) => { this._onRejected && this._onRejected.call(undefined, reason); }
        );
    }

    public then(onFulfilled: (any) => any, onRejected?: (any) => any): any {
        this._onFulfilled = onFulfilled;
        this._onRejected = onRejected;
    }
}

export = FakePromise;
