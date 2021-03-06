<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [promizr](./promizr.md) &gt; [parallel](./promizr.parallel.md)

## parallel() function

Run given tasks in parallel and resolves with an array of the results of each task.

<b>Signature:</b>

```typescript
export default function parallel<T>(tasks: Array<AsyncTask<T>>): Promise<T[]>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  tasks | Array&lt;[AsyncTask](./promizr.asynctask.md)<!-- -->&lt;T&gt;&gt; | The array of functions to execute in parallel |

<b>Returns:</b>

Promise&lt;T\[\]&gt;

