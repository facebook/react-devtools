# WebExtension Plugin

This is shared source code for the Chrome and Firefox extensions.

Changes to this code should be tested in both browsers before being submitted. Refer to the instructions in `shells/chrome` and `shells/firefox` for how to test each browser.

## Insulating the environment

React DevTools has part of the code (the backend + agent) running in the same javascript context as the inspected page, which makes the code vulnerable to environmental inconsistencies. For example, the backend uses the es6 `Map` class and normally expects it to be available in the global scope. If a user script has overridden this, the backend breaks.

To prevent this, the content script [`src/GlobalHook.js`](src/GlobalHook.js), which runs before any user js, saves the native values we depend on to the `__REACT_DEVTOOLS_GLOBAL_HOOK__` global. These are:

- Set
- Map
- WeakMap
- Object.create

Then in `webpack.backend.js`, these saved values are substituted for the globally referenced name (e.g. `Map` gets replaced with `window.__REACT_DEVTOOLS_GLOBAL_HOOK__.nativeMap`).

## Fixing document.create

React Native sets `document.createElement` to `null` in order to convince js libs that they are not running in a browser environment while `debug in chrome` is enabled.

To deal with this, [`src/inject.js`](src/inject.js) calls `document.constructor.prototype.createElement` when it needs to create a `<script>` tag.
