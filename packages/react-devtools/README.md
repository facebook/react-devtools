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
Make sure that your `react-devtools` import comes *before* your `react`
import.

## Usage with non-localhost
This is not supported yet - stay tuned!

## Developing

1) `npm run build`
2) `npm start`
3) `npm publish`
