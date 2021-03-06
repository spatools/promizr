<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [promizr](./promizr.md) &gt; [log](./promizr.log.md)

## log() function

Utility function to log the result or the error of the given `task`<!-- -->. If the `task` succeeds, its result is returned. If the `task` failed, the error is thrown.

<b>Signature:</b>

```typescript
export default function log<T extends AsyncFunction>(task: T, ...args: Parameters<T>): Async<T>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  task | T | The task to call |
|  args | Parameters&lt;T&gt; | The arguments to pass to the task |

<b>Returns:</b>

[Async](./promizr.async.md)<!-- -->&lt;T&gt;

