<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [promizr](./promizr.md) &gt; [uncallbackify](./promizr.uncallbackify_1.md)

## uncallbackify() function

Same as  but call the function immediately.

<b>Signature:</b>

```typescript
export default function uncallbackify<O extends Record<string, unknown>, T extends FunctionWithMultiCallbacks>(owner: O, fn: T, ...args: ParametersWithoutLast2<T>): Async<FunctionWithMultiCallbacksReturnType<T>>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  owner | O | The <code>this</code> context to use when calling fn |
|  fn | T | The function to promisify |
|  args | ParametersWithoutLast2&lt;T&gt; | The arguments to pass to fn |

<b>Returns:</b>

[Async](./promizr.async.md)<!-- -->&lt;FunctionWithMultiCallbacksReturnType&lt;T&gt;&gt;
