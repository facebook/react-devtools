# `npm install react-devtools`

## Why use this?
If you need to debug a react page somewhere other than Chrome on desktop (a
mobile browser, an embedded webview, safari, etc), the `react-devtools`
package is for you!

## Usage
1) Add `import 'react-devtools'` to the top of your entry file
```
import 'react-devtools'
import React, {Component} from 'react'
```

2) Run the react-devtools standalone app.
```
./node_modules/.bin/react-devtools
```

3) Profit!
Make sure that your `react-devtools` import comes *before* your `react`, `react-dom`, or `react-native`
imports.

## Advanced
If you need to customize host, port, or other settings, see the `react-devtools-core` package instead.

## Developing

1) `npm run build`
2) `npm start`
3) `npm publish`
