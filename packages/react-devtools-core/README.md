# `react-devtools-core`

A standalone React DevTools implementation.  

This is a low-level package.
**If you're looking for the Electron app you can run, use `react-devtools` package instead.**

## Exports

## `require('react-devtools-core')`

The code that needs to run in the same context as React, and initialized before React.
It will connect to the DevTools.

## `require('react-devtools-core/standalone')`

Lets you render DevTools into a DOM node and have it listen to connections.

For example:

```js
require('react-devtools-core/standalone')
  .setContentDOMNode(document.getElementById('container'))
  .startServer(port);
```

You check the Electron shell in `packages/react-devtools` for a complete integration example.
