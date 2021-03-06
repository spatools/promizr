<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [promizr](./promizr.md) &gt; [exec](./promizr.exec.md)

## exec() function

Execute `task` with given arguments by ensuring that the result is a Promise. If task throws synchronously, it's wrapped as a Promise.

<b>Signature:</b>

```typescript
export default function exec<T extends Func>(task: T, ...args: Parameters<T>): Async<ReturnType<T>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  task | T | The function to call |
|  args | Parameters&lt;T&gt; | The arguments to pass to task |

<b>Returns:</b>

[Async](./promizr.async.md)<!-- -->&lt;ReturnType&lt;T&gt;&gt;

