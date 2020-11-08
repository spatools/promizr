<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [promizr](./promizr.md) &gt; [Queue](./promizr.queue.md) &gt; [(constructor)](./promizr.queue._constructor_.md)

## Queue.(constructor)

Creates a new Queue.

<b>Signature:</b>

```typescript
constructor(worker: (arg: T) => U | Promise<U>, limit?: number, options?: QueueOptions);
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  worker | (arg: T) =&gt; U \| Promise&lt;U&gt; | The worker function to apply on each item in Queue |
|  limit | number | The maximum number of concurrent workers to launch |
|  options | [QueueOptions](./promizr.queueoptions.md) | The options for the Queue |
