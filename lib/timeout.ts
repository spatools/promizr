/**
 * @public
 * 
 * Returns a Promise that resolves when timer is done.
 * 
 * @param ms - Milliseconds to wait before resolving the Promise
 */
export default function timeout(ms?: number): Promise<void> {
    return new Promise<void>(resolve => {
        setTimeout(() => { resolve(); }, ms || 1);
    });
}
