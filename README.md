# promizr

[![NPM version](https://img.shields.io/npm/v/promizr.svg)](https://npmjs.org/package/promizr)
[![Unit Tests](https://github.com/spatools/promizr/workflows/Unit%20Tests/badge.svg)](https://github.com/spatools/promizr/actions?query=workflow%3A%22Unit+Tests%22)
[![Coverage Status](https://coveralls.io/repos/github/spatools/promizr/badge.svg?branch=%40release/v1)](https://coveralls.io/github/spatools/promizr?branch=%40release/v1)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](http://opensource.org/licenses/MIT)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)


Promizr is a modern Promise utility library which provides simple and powerful functions to manage complex async JavaScript.

Promizr provides more than 60 functions including the usual collections operations (`map`, `reduce`, `filter`, `each`…) as well as some common patterns for asynchronous control flow (`parallel`, `series`, `waterfall`…). It also include Queues to manage the maximum number of tasks to run concurrently.

## Installation

Using NPM:

```console
$ npm install promizr
```

## Usage

You could use `promizr` in different context.

### Global

```html
<script type="text/javascript" src="node_modules/promizr/dist/promizr.min.js"></script>
```

### ES Modules

```javascript
import { each } from "promizr";
await each([...], async (item) => { ... });
```

### CommonJS

```javascript
const promizr = require("promizr");
await promizr.each([...], async (item) => { ... });
```

### AMD

```javascript
// require.config.js
requirejs.config({
    paths: {
        promizr: 'node_modules/promizr/dist/promizr.min'
    }
});

// module.js
define(["promizr"], function(promizr) {
    promizr.each([...], async (item) => { ... }).then(...);
});
```

## Quick Examples

```javascript
// contents will be an array containing the content of each file
const contents = await promizr.map(['file1.json','file2.json','file3.json'], async (src) => {
    const res = await fetch(`https://host/${src}`);
    return res.json();
});

// entities will be an array containing an array of ids of public entities
const entities = await promizr.filter(['entity1','entity2','entity3'], async (entityId) => {
    const res = await fetch(`https://api/entities/${entityId}`);
    const entity = await res.json();
    return entity.isPublic;
});

// operations will run in parallel
const [result1, result2, result3] = await promizr.parallel([
    async () => operation1Async(),
    async () => operation2Async(),
    async () => operation3Async(),
];
```

## Documentation

You can find the package documentation [here](./docs/promizr.md).

## License

This project is under [MIT](./LICENSE) License. See the LICENSE file for the full license text.
