<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [promizr](./promizr.md) &gt; [findSeries](./promizr.findseries.md)

## findSeries() function

The same as [find()](./promizr.find.md)<!-- -->, only the `iterator` is applied to each item in `array` in series. This means the result is always the first in the original `array` (in terms of array order) that passes the truth test.

<b>Signature:</b>

```typescript
export default function findSeries<T>(array: T[], iterator: AsyncListIterator<T, boolean>): Promise<T | undefined>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  array | T\[\] | The array to iterate on |
|  iterator | [AsyncListIterator](./promizr.asynclistiterator.md)<!-- -->&lt;T, boolean&gt; | The iterator which test each item |

<b>Returns:</b>

Promise&lt;T \| undefined&gt;
