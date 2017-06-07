# The Firefox extension

The source code for this extension has moved to `shells/webextension`. Instructions for building it can be found there.

## Testing in Firefox

First install the [`web-ext` command line tool](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Getting_started_with_web-ext#Installation).

```bash
npm install --global web-ext
```

Now you can build the WebExtension and test it as follows:

```bash
cd shells/chrome

# Build source (to include local changes)
./build.sh

# Test the local extension in Firefox
web-ext run
```

You can also test against a specific Firefox version by passing a path to the `firefox` instance. For the Nightly build this can be done by passing the string "nightly":

```bash
web-ext run --firefox=nightly
```
