# Project Structure

###/

The root folder contains the main files used by the Chrome extension.
`main.html` bootstraps the extension.

###/blink

This Git submodule contains a copy of the DevTools from the Blink project.

This folder should never diverge from the upstream version. That way we can
keep a consistent look and reuse a lot of UI elements from the built-in Chrome
Developer Tools.

Only a small subset of these files are currently in use. The holes are patched
using files from the views folder.

###/views

The views folder contains views that are specific to the React Developer Tools.

`WebInspectorPatch.js` monkey patches all the WebInspector components that hook
into internals that we don't have access to from a Chrome extension.

###/agents

These are stubs APIs to access the pseudo DOM representation of React components
and JavaScript runtime objects. The ReactInspectorAgent is the client that
communicates cross-process to the inspected page. Since this is done
cross-process, these APIs are all asynchronous.

###/injected

These files gets evaluated the context of the inspected page. They're
essentially the host that the agents communicate with.

The format of these files is a single function that gets passed it's
dependencies by ReactInspectorAgent.

###/tests

This folder contains a sample React page. It's intended as a relatively stable
page intended to make sure all features works as expected.
