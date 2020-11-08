<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [promizr](./promizr.md) &gt; [PriorityQueue](./promizr.priorityqueue.md) &gt; [(constructor)](./promizr.priorityqueue._constructor_.md)

## PriorityQueue.(constructor)

Creates a new PriorityQueue.

<b>Signature:</b>

```typescript
constructor(worker: (arg: T) => U | Promise<U>, limit?: number, options?: PriorityQueueOptions);
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  worker | (arg: T) =&gt; U \| Promise&lt;U&gt; | The worker function to apply on each item in PriorityQueue |
|  limit | number | The maximum number of concurrent workers to launch |
|  options | [PriorityQueueOptions](./promizr.priorityqueueoptions.md) | The options for the PriorityQueue |
