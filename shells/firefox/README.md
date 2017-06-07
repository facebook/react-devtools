# The Firefox extension

The source code for this extension has moved to `shells/webextension`.

Modify the source code there and then rebuild this extension by running `node build.js` in this directory.

## Testing in Firefox

 1. Install the [`web-ext` command line tool](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Getting_started_with_web-ext#Installation).
 1. In terminal, `cd shells/firefox/build/unpacked`
 1. Run the local extension in Firefox by `web-ext run`

You can also test against a specific Firefox version by passing a path to the `firefox` instance. For the Nightly build this can be done by passing the string "nightly":

```bash
web-ext run --firefox=nightly
```
