# The Chrome extension

The source code for this extension has moved to `shells/webextension`.

Modify the source code there and then rebuild this extension by running `node build.js` in this directory.

## Testing in Chrome

You can test a local build of the web extension like so:

 1. Open [`chrome://extensions/`](chrome://extensions/) in Chrome.
 1. Click the "_Load unpacked extension..._" button.
 1. Select the directory `shells/chrome/build/unpacked`.