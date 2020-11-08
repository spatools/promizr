# promizr

[![Build Status](https://travis-ci.org/spatools/promizr.png)](https://travis-ci.org/spatools/promizr)
[![Bower version](https://badge.fury.io/bo/promizr.png)](http://badge.fury.io/bo/promizr)
[![NuGet version](https://badge.fury.io/nu/Promizr.png)](http://badge.fury.io/nu/Promizr)
[![NPM version](https://badge.fury.io/js/promizr.png)](http://badge.fury.io/js/promizr)

Promise extensions and utility methods (Timeout, Filtering, Mapping, Queue, etc.).

## Installation

Using NPM:

```console
$ npm install promizr
```

Using NuGet:

```console
$ Install-Package Promizr
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
