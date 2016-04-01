# React Developer Tools [![Build Status](https://travis-ci.org/facebook/react-devtools.svg?branch=master)](https://travis-ci.org/facebook/react-devtools)

React Developer Tools is a system that allows you to inspect a React Renderer,
including the Component hierarchy, props, state, and more.

There are shells for Chrome (adding it to the Chrome devtools), Firefox,
Atom/Nuclide, and as a standalone Electron app.

![](/images/devtools-full.gif)

## Installation

### Pre-packaged
The official extensions represent the current stable release.

- [Chrome extension](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Firefox extension](https://addons.mozilla.org/firefox/addon/react-devtools/)
- Standalone app (coming soon)

If you inspect an element or launch the developer tools on a React page, you
should see an extra tab called **React** in the inspector.

Check out [For Hacking](#for-hacking) if you want to develop the Developer
Tools or use a pre-prelease version.

## Usage

### Tree View

- Arrow keys or hjkl for navigation
- Right click a component to show in elements pane, scroll into view, show
  source, etc.
- Use the search bar to find components by name
- A red collapser means the component has state/context

![](/images/devtools-tree-view.png)

### Side Pane

- Right-click to store as global variable
- Updates are highlighted

![](/images/devtools-side-pane.gif)

## For Hacking
For changes that don't directly involve Chrome/Firefox/etc. APIs, there is a
"plain" shell that just renders the devtools into an html page along with a
TodoMVC test app. This is by far the quickest way to develop. Check out
[the Readme.md](/shells/plain) in `/shells/plain` for info.

For other shells (Chrome, Firefox, etc.), see the respective directories in `/shells`.

## FAQ

### The React Tab Doesn't Show Up

The "React" tab won't show up if React can't communicate with the
devtools. When the page loads, the devtools sets a global named
`__REACT_DEVTOOLS_GLOBAL_HOOK__`, then React communicates with that
hook during initialization.

(In React 0.11 and older, it was necessary to expose a global called `React`
for the devtools to function.)

You can test this on the [React website](http://facebook.github.io/react/)
or by inspecting [Facebook](https://www.facebook.com/).

Currently iframes and Chrome apps/extensions are not inspectable.

### Does "Trace React Updates" trace renders?

Yes, but it's also tracing if a component *may* render.
In order to fully understand what counts as an "update", you need to understand how [shouldComponentUpdate](https://facebook.github.io/react/docs/advanced-performance.html#shouldcomponentupdate-in-action) works.
![](https://facebook.github.io/react/img/docs/should-component-update.png)

Here "Trace React Updates" will draw a border around every node but C4 and C5.
Why does it trace components that don't actually update? (via shouldComponentUpdate() -> false) 
This is a limitation of the system used to track updates, and will hopefully change in the future. It doesn't, however, trace the children of components that opt out, as there's no possibility of them updating.
The higher the rate of updates happening per second the more the color changes from blue to red.

### ProTips

If you inspect a React element on the page using the regular **Elements** tab,
then switch over to the **React** tab, that element will be automatically
selected in the React tree.

## Debugging (in Chrome)

What to do if the extension breaks.

- check the error console of devtools. Part of React Devtools runs scripts in
    the context of your page, and is vulnerable to misbehaving polyfills.
- open devtools out into a new window, and then hit the shortcut to open
    devtools again (cmd+option+j or ctrl+shift+j). This is the "debug
    devtools" debugger. Check the console there for errors.
- open `chrome://extensions`, find react devtools, and click "background page"
    under "Inspected views". You might find the errors there.

## Contributing

To read more about the community and guidelines for submitting pull requests,
please read the [Contributing document](CONTRIBUTING.md).
