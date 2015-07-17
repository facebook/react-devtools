# The Firefox addon
This shell lets you use react devtools as a firefox devtools extension.

{{screenshot}}

## Installation

- `npm install -g jpm`
- `webpack` or `webpack --watch`
- `jpm run --debug`

## Hacking

The files in `main` are *not* transpiled by webkit/babel, but are run in firefox
extension context. Still, you have some es6 things like string template
literals, object literal shorthand, and object destructuring, and let/const.

Everything else is transpiled.
