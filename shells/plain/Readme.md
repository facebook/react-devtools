# Pure HTML Example

![Screenshot](/images/plain-shell.png)

This is an example of using the devtools outside of chrome/firefox/etc. In
order to simulate the same network restrictions found in a plugin environment,
the inspection target is within an iframe, and communication is done via
`.postMessage`.

You have to run `./build.sh` (or `./build.sh --watch`) to be able to run this. Then
open `index.html`.

Here's an overview of how things work:

- the devtools ui loads
- an iframe is created, and the global (`__REACT_DEVTOOLS_GLOBAL_HOOK__`) is
  setup.
- the inspection target script is added to the iframe (from `/test/example/`)
- the devtools backend is added to the iframe

And yes, you can use this to inspect the inspector :) but remember to enable 
file access for your browser's react-devtools extension.