<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [promizr](./promizr.md) &gt; [tap](./promizr.tap.md)

## tap() function

Build a function that takes an argument, calls the `task` and resolve with the input argument. This function is usefull to call a function during a Promise chain without breaking the chain.

<b>Signature:</b>

```typescript
export default function tap<Task extends AsyncFunction>(task: Task, ...args: Parameters<Task>): <U>(arg: U) => Promise<U>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  task | Task | The function to be called during tap. |
|  args | Parameters&lt;Task&gt; | The arguments to be called to task. |

<b>Returns:</b>

&lt;U&gt;(arg: U) =&gt; Promise&lt;U&gt;

## Example


```typescript
return myAwesomeTask()
    .then(result => `prefix-${result}`)
    .then(promizr.tap(logActionToServer, token))
    .then(result => result.startsWith("prefix-"));

```

