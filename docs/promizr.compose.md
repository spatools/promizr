<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [promizr](./promizr.md) &gt; [compose](./promizr.compose.md)

## compose() function

Prepare a new function that transfer its arguments to the last `task` then calls each `task` using the result of the previous `task`<!-- -->. Resolves with the result of the first `task`<!-- -->.

Note: Execution order if from end to start.

<b>Signature:</b>

```typescript
export default function compose<T extends AsyncFunction[]>(...tasks: T): (...args: Parameters<GetLast<T>>) => Async<GetFirstReturnType<T>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  tasks | T | Functions to be run from last to first |

<b>Returns:</b>

(...args: Parameters&lt;GetLast&lt;T&gt;&gt;) =&gt; [Async](./promizr.async.md)<!-- -->&lt;GetFirstReturnType&lt;T&gt;&gt;
