# The Chrome Plugin

To hack on the plugin, on the main repo's directory:

- run `npm install`
- run `npm build-chrome` or `npm run build-chrome -- --watch`
- Go to `chrome://extensions`, check "developer mode", and click "Load
  unpacked extension", and select this directory
- Hack away!

Generally, changes to the UI will auto-propagate (close devtools and re-open
them). If you change the background script or injector, you'll have to reload
the extension from the extensions page.
