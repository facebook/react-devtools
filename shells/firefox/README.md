# The Firefox ~~add-on~~ extension

The firefox add-on used to have its own shell. However Mozilla has been gradually deprecating add-ons in favor of the newer WebExtensions API. By the end of 2017 (eg Firefox 57) they plan to [only support WebExtensions](https://blog.mozilla.org/addons/2016/11/23/add-ons-in-2017/).

In order to stay compatible with future Firefox versions the old React DevTools add-on has been deprecated. The Chrome WebExtension should be used for both Chrome and Firefox.

## Installation

Follow installation instructions in `shells/chrome`.

## Hacking

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
