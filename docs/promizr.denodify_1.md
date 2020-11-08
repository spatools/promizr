<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [promizr](./promizr.md) &gt; [denodify](./promizr.denodify_1.md)

## denodify() function

Same as  but call the function immediately.

<b>Signature:</b>

```typescript
export default function denodify<O extends Record<string, unknown>, T extends FunctionWithNodeStyleCallback>(owner: O, fn: T, ...args: ParametersWithoutLast<T>): Async<FunctionWithNodeStyleCallbackReturnType<T>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  owner | O | The <code>this</code> context to use when calling fn |
|  fn | T | The function to promisify |
|  args | ParametersWithoutLast&lt;T&gt; | The arguments to pass to fn |

<b>Returns:</b>

[Async](./promizr.async.md)<!-- -->&lt;FunctionWithNodeStyleCallbackReturnType&lt;T&gt;&gt;
