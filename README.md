# promizr
[![Build Status](https://travis-ci.org/spatools/promizr.png)](https://travis-ci.org/spatools/promizr)
[![Bower version](https://badge.fury.io/bo/promizr.png)](http://badge.fury.io/bo/promizr)
[![NuGet version](https://badge.fury.io/nu/Promizr.png)](http://badge.fury.io/nu/Promizr)
[![NPM version](https://badge.fury.io/js/promizr.png)](http://badge.fury.io/js/promizr)

ES6 Promise extensions and utility methods (Timeout, Filtering, Mapping, Queue, etc.)
Also contains a Polyfill which strictly follows ES6 specification

## Installation

Using Bower:

```console
$ bower install promizr --save
```

Using NuGet:

```console
$ Install-Package Promizr
```

Using NPM:

```console
$ npm install promizr --save
```

## Usage

You could use promizr in different context.

### Browser (with built file)

Include built script in your HTML file.

```html
<script type="text/javascript" src="path/to/promizr/polyfill.min.js"></script>
<script type="text/javascript" src="path/to/promizr/promizr.min.js"></script>
```

### Browser (AMD from source)

Configure RequireJS.

```javascript
requirejs.config({
    paths: {
        promise: 'path/to/promizr/polyfill',
        promizr: 'path/to/promizr/promizr'
    }
});
```

Then include promise in your dependencies.

```javascript
define(["promise", "promizr"], function(Promise, promizr) {
    var promise = new Promise(function(resolve, reject) {

    });

    promizr.each([...], function(item) { return aPromise; }).then(...);
});
```

### Node (installed using NPM)

Call require to register Promise to global object

```javascript
var promizr = require("promizr");
promizr.polyfill();

var promise = new Promise(function(resolve, reject) {

});

promizr.each([...], function(item) { return aPromise; }).then(...);
```

## Contribute

### Preparation

Checkout repository and install dependencies

```console
$ git clone https://github.com/spatools/promizr.git 
$ npm install -g grunt-cli bower tsd
$ npm install && bower install && tsd reinstall
```

## Documentation

You can find documentation about EcmaScript 6 Promise specification on some websites.

* [Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
* [HTML5Rocks](http://www.html5rocks.com/en/tutorials/es6/promises/)

This library strictly follows EcmaScript 6 Specification which can be found on [EcmaScript Wiki](http://wiki.ecmascript.org/doku.php?id=harmony:specification_drafts).

* [Word](http://wiki.ecmascript.org/lib/exe/fetch.php?id=harmony%3Aspecification_drafts&cache=cache&media=harmony:working_draft_ecma-262_edition_6_01-20-14.doc)
* [PDF](http://wiki.ecmascript.org/lib/exe/fetch.php?id=harmony%3Aspecification_drafts&cache=cache&media=harmony:working_draft_ecma-262_edition_6_01-20-14.pdf)

### Build configurations

#### Test

Any changes should be tested. Any additions should have a new test associated with it.

```console
$ grunt test
# or
$ grunt test-polyfill
# or
$ grunt test-promizr
```

#### Build

```console
$ grunt build
# or
$ grunt polyfill
# or
$ grunt promizr
```
