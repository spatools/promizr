<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [promizr](./promizr.md) &gt; [promisify](./promizr.promisify.md)

## promisify() function

Build a function that transform a Node-Style callback function to a Promise version.

<b>Signature:</b>

```typescript
export default function promisify<T extends FunctionWithNodeStyleCallback>(fn: T): (...args: ParametersWithoutLast<T>) => Async<FunctionWithNodeStyleCallbackReturnType<T>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  fn | T | The function to promisify |

<b>Returns:</b>

(...args: ParametersWithoutLast&lt;T&gt;) =&gt; [Async](./promizr.async.md)<!-- -->&lt;FunctionWithNodeStyleCallbackReturnType&lt;T&gt;&gt;

