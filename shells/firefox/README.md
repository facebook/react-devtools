# The Firefox addon
This shell lets you use react devtools as a firefox devtools extension.

{{screenshot}}

## Installation

- `npm install -g jpm`
- `npm install` in the repo root folder
- `./build.sh`

This will produce an `xpi` file. You can load it in Firefox via Addons > gear icon > Debug Addons > Load Temporary Addon.

## Hacking

The files in `main` are *not* transpiled by webkit/babel, but are run in firefox
extension context. Still, you have some es6 things like string template
literals, object literal shorthand, and object destructuring, and let/const.

Everything else is transpiled.
