import { setImmediate } from "./setImmediate";
/**
 * @public
 * 
 * Same as {@see setImmediate} but could not be aborted.
 * 
 * @param callback - The callback to call at the end of the event loop.
 */
export default function nextTick(callback: () => void): void {
    setImmediate(callback);
}
