# React Developer Tools [![Build Status](https://travis-ci.org/facebook/react-devtools.svg?branch=master)](https://travis-ci.org/facebook/react-devtools)

React Developer Tools lets you inspect the React component hierarchy, including component props and state.

It exists both as a browser extension (for [Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) and [Firefox](https://addons.mozilla.org/firefox/addon/react-devtools/)), and as a [standalone app](https://github.com/facebook/react-devtools/tree/master/packages/react-devtools) (works with other environments including Safari, IE, and React Native).

![](/images/devtools-full.gif)

## Installation

### Pre-packaged

The official extensions represent the current stable release.

- [Chrome extension](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Firefox extension](https://addons.mozilla.org/firefox/addon/react-devtools/)
- [Standalone app (Safari, React Native, etc)](https://github.com/facebook/react-devtools/blob/master/packages/react-devtools/README.md)

Opera users can [enable Chrome extensions](https://addons.opera.com/extensions/details/download-chrome-extension-9/) and then install the [Chrome extension](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi).

## Usage

The extension icon will light up on the websites using React:

<img src="http://i.imgur.com/3tuhIgm.png" alt="Extension icon becomes active" width="500">

On such websites, you will see a tab called React in Chrome Developer Tools:

<img src="http://i.imgur.com/jYieRqi.png" alt="React tab in DevTools" width="500">

A quick way to bring up the DevTools is to right-click on the page and press Inspect.

### Tree View

- Arrow keys or hjkl for navigation
- Right click a component to show in elements pane, scroll into view, show
  source, etc.
- Differently-colored collapser means the component has state/context

![](/images/devtools-tree-view.png)

### Side Pane

- Right-click to store as global variable
- Updates are highlighted

![](/images/devtools-side-pane.gif)

### Search Bar

- Use the search bar to find components by name

![](/images/devtools-search-new.gif)

### Handy Tips

#### Finding Component by a DOM Node

If you inspect a React element on the page using the regular **Elements** tab, then switch over to the **React** tab, that element will be automatically selected in the React tree.

#### Finding DOM Node by a Component

You can right-click any React element in the **React** tab, and choose "Find the DOM node". This will bring you to the corresponding DOM node in the **Elements** tab.

#### Displaying Element Source

You may include the [transform-react-jsx-source](https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-react-jsx-source)  Babel plugin to see the source file and line number of React elements. This information appears in the bottom of the right panel when available. Don't forget to disable it in production! (Tip: if you use [Create React App](https://github.com/facebookincubator/create-react-app) it is already enabled in development.)

#### Usage with React Native and Safari

There is a [standalone version](https://github.com/facebook/react-devtools/blob/master/packages/react-devtools/README.md) that works with other environments such as React Native and Safari.

## FAQ

### The React Tab Doesn't Show Up

**If you are running your app from a local `file://` URL**, don't forget to check "Allow access to file URLs" on the Chrome Extensions settings page. You can find it by opening Settings > Extensions:

![Allow access to file URLs](http://i.imgur.com/Yt1rmUp.png)

Or you could develop with a local HTTP server [like `serve`](https://www.npmjs.com/package/serve).

**The React tab won't show up if the site doesn't use React**, or if React can't communicate with the devtools. When the page loads, the devtools sets a global named `__REACT_DEVTOOLS_GLOBAL_HOOK__`, then React communicates with that hook during initialization. You can test this on the [React website](http://facebook.github.io/react/) or by inspecting [Facebook](https://www.facebook.com/).

**If your app is inside of CodePen**, make sure you are registered. Then press Fork (if it's not your pen), and then choose Change View > Debug. The Debug view is inspectable with DevTools because it doesn't use an iframe.

**If your app is inside an iframe, a Chrome extension, React Native, or in another unusual environment**, try [the standalone version instead](https://github.com/facebook/react-devtools/tree/master/packages/react-devtools). Chrome apps are currently not inspectable.

**If you still have issues** please [report them](https://github.com/facebook/react-devtools/issues/new). Don't forget to specify your OS, browser version, extension version, and the exact instructions to reproduce the issue with a screenshot.

### Does "Highlight Updates" trace renders?

With React 15 and earlier, "Highlight Updates" had false positives and highlighted more components than were actually re-rendering.

Since React 16, it correctly highlights only components that were re-rendered.

## Contributing

For changes that don't directly involve Chrome/Firefox/etc. APIs, there is a
"plain" shell that just renders the devtools into an html page along with a
TodoMVC test app. This is by far the quickest way to develop. Check out
[the Readme.md](/shells/plain) in `/shells/plain` for info.

For other shells (Chrome, Firefox, etc.), see the respective directories in `/shells`.

For a list of good contribution opportunities, check the [good first bug](https://github.com/facebook/react-devtools/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+bug%22) label. We're happy to answer any questions on those issues!

To read more about the community and guidelines for submitting pull requests,
please read the [Contributing document](CONTRIBUTING.md).

## Debugging (in Chrome)

What to do if the extension breaks.

- check the error console of devtools. Part of React Devtools runs scripts in
    the context of your page, and is vulnerable to misbehaving polyfills.
- open devtools out into a new window, and then hit the shortcut to open
    devtools again (cmd+option+j or ctrl+shift+j). This is the "debug
    devtools" debugger. Check the console there for errors.
- open `chrome://extensions`, find react devtools, and click "background page"
    under "Inspected views". You might find the errors there.

