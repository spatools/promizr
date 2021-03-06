<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [promizr](./promizr.md) &gt; [applyOn](./promizr.applyon.md)

## applyOn() function

Same as [apply()](./promizr.apply.md) but call the `task` with `owner` `this` context. If task is a string, it calls `owner[task]` function.

<b>Signature:</b>

```typescript
export default function applyOn<O, K extends MethodNames<O>>(owner: O, task: K, ...args: Parameters<O[K]>): () => Async<ReturnType<O[K]>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  owner | O | <code>this</code> context to use when calling <code>task</code> |
|  task | K | The property name of function in <code>owner</code> |
|  args | Parameters&lt;O\[K\]&gt; | The <code>task</code> argument |

<b>Returns:</b>

() =&gt; [Async](./promizr.async.md)<!-- -->&lt;ReturnType&lt;O\[K\]&gt;&gt;

## Example


```typescript
const lib = {
    upper(value: string): string { return value.toUpperCase() }
}

const task = promizr.applyOn(lib, "upper", "Value");

const res = await task();
// res === "VALUE"

```

