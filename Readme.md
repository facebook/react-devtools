# New React Developer Tools

React Developer Tools is a system that allows you to inspect a React Renderer,
including the Component hierarchy, props, state, and more.

There are shells for chrome (adding it to the chrome devtools), firefox,
atom/nuclide, and as a standalone electron app.

## Installing the Chrome Plugin
Because that's likely why you're here.

### Easy

[Install the extension from Chrome Web Store](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)

If you inspect an element or launch the developer tools on a React page, you
should see an extra tab called **React** in the inspector.

### For Hacking
See also [Hackage](#Hackage) below.

Check out the [Readme.md](/shells/chrome) in the `/shells/chrome` directory.

## Usage

### Tree View

### Side Pane

## Hackage

For changes that don't directly involve chrome/firefox/etc. APIs, there is a
"plain" shell that just renders the devtools into an html page along with a
TodoMVC test app. This is by far the quickest way to develop. Check out
[the Readme.md](/shells/plain) in `/shells/plain` for info.

For other shells, see the respective directories in `/shells`.

## FAQ

### How do I use this for React < 0.13?
You can use the old plugin.
{{TODO link to .crx}}

### The React Tab Doesn't Show Up

There are a couple of possible causes.

- you are using react &lt; v0.13. See above.
- react hasn't loaded on your page yet. The react tab will not show up if
  react is not yet present on the page.

## Debugging (in chrome)
What to do if the extension breaks.

- check the error console of devtools. Part of React Devtools runs scripts in
    the context of your page, and is vulnerable to misbehaving polyfills.
- pop devtools out into a new window, and then hit the shortcut to open
    devtools again (cmd-option-j or ctrl+shift+j). This is the "debug
    devtools" debugger. Check the console there for errors.
- open `chrome://extensions`, find react devtools, and click "background page"
    under "Inspected views". You might find the errors there.


# The Old Readme

React Developer Tools is a Chrome extension that allows you to inspect the React
component hierarchy in the Chrome Developer Tools (formerly WebKit Web
Inspector).

## Installation

### Easy

[Install the extension from Chrome Web Store](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)

If you inspect an element or launch the developer tools on a React page, you
should see an extra tab called **React** in the inspector.

### Hard

Clone the GitHub repository.

```
git clone git@github.com:facebook/react-devtools.git
```

Clone the blink submodule.

```
git submodule update --init
```

Open the URL [chrome://extensions/](chrome://extensions/) in your browser.

Check the box for **Developer Mode**

Click the button **Load unpacked extension...**

Select the folder where you downloaded the repository.

The extension is now installed.

### The React Tab Doesn't Show Up?

The "React" tab won't show up if React can't communicate with the
devtools. When the page loads, the devtools sets a global named
`__REACT_DEVTOOLS_GLOBAL_HOOK__`, then React communicates with that
hook during initialization.

(In React 0.11 and older, it was necessary to expose a global called `React`
for the devtools to function.)

You can test this on the [React website](http://facebook.github.io/react/)
or by inspecting [Facebook](https://www.facebook.com/).

### The React Tab Is Blank?

Due to a [bug in Chrome](https://code.google.com/p/chromium/issues/detail?id=319328),
devtools extensions are unable to use `localStorage` if the "Block third-party
cookies and site data" option is checked in the Chrome content settings. Until
this bug is fixed, please make sure this preference is unchecked.

## Usage

You should have a new tab called **React** in your Chrome DevTools. This shows
you the root React components that was rendered on the page, as well as the
subcomponents that they ended up rendering.

By selecting one of the components in the tree you can inspect and edit its
current props and state in the panel on the right. In the breadcrumbs you can
inspect the selected Component, the Component that created it, the Component
that created that one, and so on.

### ProTips

If you inspect a React element on the page using the regular **Elements** tab,
then switch over to the **React** tab, that element will be automatically
selected in the React tree.

Similarly, if you have a breakpoint within the render phase of a Component, that
will be automatically selected in the **React** tab. This allows you to step
through the rendering tree and see how one Component affects another one.

By breaking on errors, you can easily find which component threw an error during
rendering, and what props lead to it.

## Contribute

### Test Environment

Open the Chrome DevTools on any React page by inspecting an element.

In a different tab goto [chrome://inspect/](chrome://inspect/). Open the last
section called **Others**. This contain your DevTools instance. Click the
**inspect** link next to it. That should open up another DevTools instance,
which is inspecting the first one, including the React extension. Inception.

If you don't have a simple React page available you can use the built-in test
page. Open the URL [chrome://extensions/](chrome://extensions/) again. Look for
the unique **ID** of the extension. E.g:

```
chrome-extension://fmkadmapgofadopljbjfkapdkoienihi/tests/page.html
```

### Project Structure

The purpose of this project is to trail the DevTools of the Chromium project.
Therefore the project is structured similarly. For example this project
doesn't use a module system. Each file is inserted using a script tag in the
global scope of the page. Files are isolated by global namespaces.

Please read the [Structure document](STRUCTURE.md) for more information about
the folder structure of the project.

### More…

There's only so much we can cram in here. To read more about the community and
guidelines for submitting pull requests, please read the [Contributing document](CONTRIBUTING.md).
