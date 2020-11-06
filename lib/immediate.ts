import nextTick from "./nextTick";

/**
 * Returns a Promise that resolves on next tick.
 */
export default function immediate(): Promise<void> {
    return new Promise<void>(resolve => { nextTick(resolve); });
}
