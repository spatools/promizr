# [1.0.0-beta.1](https://github.com/spatools/promizr/compare/v0.2.9...v1.0.0-beta.1) (2020-11-08)


### Code Refactoring

* create new module structure ([2358302](https://github.com/spatools/promizr/commit/235830236296ca01791112cb87177c65618ec1b4))


### Features

* upgrade to TypeScript v4 ([be96945](https://github.com/spatools/promizr/commit/be96945617f0d52b52a5714733b6f195a341f057))


### BREAKING CHANGES

* applyEach now always return a function
* Queue constructor now takes options instead of list
* Queue 'length', 'running' and 'idle' now are properties
* removing Queues factory functions
* remove module function
* remove polyfill from utils