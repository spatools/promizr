
export default function createExecutorObject<T extends (string | number), U>(list: T[], mapper: (key: T) => () => Promise<U>, includeNotCallable?: boolean): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    list.forEach(val => {
        result[`property-${val}`] = mapper(val);
    });

    if (includeNotCallable) {
        result["not-called"] = "value";
    }

    return result;
}
