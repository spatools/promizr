<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [promizr](./promizr.md) &gt; [times](./promizr.times.md)

## times() function

Executes `task` the given number of `times`<!-- -->. Returns an array with the result of each `task` execution.

<b>Signature:</b>

```typescript
export default function times<T>(times: number, task: AsyncTask<T>): Promise<T[]>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  times | number | The number of times <code>task</code> should be called |
|  task | [AsyncTask](./promizr.asynctask.md)<!-- -->&lt;T&gt; | The task to run multiple times |

<b>Returns:</b>

Promise&lt;T\[\]&gt;
