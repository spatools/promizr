﻿# promizr

[![Unit Tests](https://github.com/spatools/promizr/workflows/Unit%20Tests/badge.svg)](https://github.com/spatools/promizr/actions?query=workflow%3A%22Unit+Tests%22)
[![Coverage Status](https://coveralls.io/repos/github/spatools/promizr/badge.svg?branch=%40release/v1)](https://coveralls.io/github/spatools/promizr?branch=%40release/v1)
[![NPM version](https://badge.fury.io/js/promizr.png)](http://badge.fury.io/js/promizr)


Promise extensions and utility methods (Timeout, Filtering, Mapping, Queue, etc.).

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
await each([...], async (item) => { ... }).then(...);
```

### CommonJS

```javascript
const promizr = require("promizr");
await promizr.each([...], async (item) => { ... }).then(...);
```

### AMD

```javascript
// require.config.js
requirejs.config({
    paths: {
        promizr: 'node_modules/promizr/promizr.min'
    }
});

// module.js
define(["promise", "promizr"], function(Promise, promizr) {
    var promise = new Promise(function(resolve, reject) {

    });

    promizr.each([...], function(item) { return aPromise; }).then(...);
});
```

## Documentation

You can find the package documentation [here](./docs/promizr.md).

## License

This project is under [MIT](./LICENSE) License. See the LICENSE file for the full license text.
