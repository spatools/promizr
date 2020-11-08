<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [promizr](./promizr.md) &gt; [until](./promizr.until.md)

## until() function

The opposite of [whilst()](./promizr.whilst.md)<!-- -->. Calls the `task` function until the `test` function returns `true`<!-- -->.

<b>Signature:</b>

```typescript
export default function until<T>(test: AsyncTask<boolean>, task: AsyncTask<T>): Promise<void>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  test | [AsyncTask](./promizr.asynctask.md)<!-- -->&lt;boolean&gt; | The function that test if the process should continue |
|  task | [AsyncTask](./promizr.asynctask.md)<!-- -->&lt;T&gt; | The task to execute while <code>test</code> fails |

<b>Returns:</b>

Promise&lt;void&gt;
