# Overview

DevTools has a couple of high level components:

- A **backend** script that runs in the same context as React and listens for events from React.
- A **frontend** interface that shows the current component tree and allows users to interact with it.
- A **Bridge** that enables the frontend and backend to communicate by sending (serialized) messages.
- An **Agent** that relays messages between the backend and the registered bridges.
- Various (Flux-like) **stores** that contain shared frontend state.

In addition to the above components, DevTools also supports **plug-ins**. These are broken down into backend and frontend components as well:

- Plug-in backends have access to the shared Bridge and Agent
- Plug-in frontends are typically panels that get added to the existing DevTools UI.
- Plug-in frontends also have their own, smaller stores that have access to the main DevTools store as well as the shared Bridge.

Much of the code (e.g. the frontend UI, stores, and bridge) is shared between the different DevTools builds, but the main entry points (backend and frontend) are build-specific.

# DevTools variants

DevTools comes in a couple of flavors:

- [**react-devtools-core**](https://www.npmjs.com/package/react-devtools-core) and [**react-devtools**](https://www.npmjs.com/package/react-devtools) NPM packages; these comprise a standalone build and Nuclide plug-in and are used for React Native.
- **Browser extension** for React DOM; supports both Chrome and Firefox browsers.
- **"Plain" shell** for testing UI changes in development mode.

## Backend

Each DevTools build has its own backend script:

- **`react-devtools` NPM packages** - [`packages/react-devtools-core/src/backend.js`](https://github.com/facebook/react-devtools/blob/master/packages/react-devtools-core/src/backend.js)
- **Browser extension** - [`shells/webextension/src/backend.js`](https://github.com/facebook/react-devtools/blob/master/shells/webextension/src/backend.js)
- **"Plain" shell** - [`shells/plain/backend.js`](https://github.com/facebook/react-devtools/blob/master/shells/plain/backend.js)

Each of the above backend scripts instantiate the `Agent` and `Bridge` and pass them to the main `inject()` method ([`agent/inject.js`](https://github.com/facebook/react-devtools/blob/master/agent/inject.js)) which in turn calls the main `setupBackend()` method ([`backend/backend.js`](https://github.com/facebook/react-devtools/blob/master/backend/backend.js)).

## Frontend

Each DevTools build has its own frontend script:

- **`react-devtools` NPM packages** - [`packages/react-devtools/app.js`](https://github.com/facebook/react-devtools/blob/master/packages/react-devtools/app.js) (which really just loads [`packages/react-devtools-core/src/standalone.js`](https://github.com/facebook/react-devtools/blob/master/packages/react-devtools-core/src/standalone.js))
- **Browser extension** - [`shells/webextension/src/main.js`](https://github.com/facebook/react-devtools/blob/master/shells/webextension/src/main.js) (which just detects React and loads [`shells/webextension/src/panel.js`](https://github.com/facebook/react-devtools/blob/master/shells/webextension/src/panel.js)) and [`shells/webextension/src/background.js`](https://github.com/facebook/react-devtools/blob/master/shells/webextension/src/background.js)
- **"Plain" shell** - [`shells/plain/container.js`](https://github.com/facebook/react-devtools/blob/master/shells/plain/container.js)

The above frontend scripts all load the main DevTools UI panel ([`frontend/Panel.js`](https://github.com/facebook/react-devtools/blob/master/frontend/Panel.js)).

The browser extension also has an additional `background.js` entry point which shows an icon and pop-up message based on whether React is present on the page, and which version and build (development vs production) it is.

# How does React connect with DevTools?

- React renderer inject themselves during initialization if there is a global `__REACT_DEVTOOLS_GLOBAL_HOOK` variable.
- In some cases, the main `backend` script will also inject a `window.React` global as part of its initialization.

# How do the modules fit together?

The overview above describes the high level components and their purposes. This section goes into more detail about what each does and how they interact.

## [`backend/installGlobalHook`](https://github.com/facebook/react-devtools/blob/master/backend/installGlobalHook.js) (backend)

- Creates `hook` object and defines the global `__REACT_DEVTOOLS_GLOBAL_HOOK`.
  - This `hook` defines on/off/emit methods that notify of renderer events (e.g. mount, update, unmount)
  - The `hook` also defines special Fiber-only hooks for commit-root and unmount-fiber.
- Determines the build type (e.g. production, development) based on the injected renderer.
- Warns about bad dead code elimination for production builds.

## [`backend/attachRenderer`](https://github.com/facebook/react-devtools/blob/master/backend/attachRenderer.js) (backend)

- Interops between renderer impls (e.g. stack, fiber) and hook.
  - Decorates **stack** render methods and "emits" them as hook events (e.g. "mount", "update", "root").
  - **Fiber** explicitly calls the hook (on commit or unmount) which calls `attachRendererFiber` which "emits" them as hook events (e.g. "mount", "update", "root").

## [`agent/inject`](https://github.com/facebook/react-devtools/blob/master/agent/inject.js) (backend)

- Passed the `hook` and `agent` instances.
- Calls `setupBackend` (`backend.js`).
- Sets up subscriptions that forward `hook` events to the `agent`.
- Unsubscribes from the `hook` on "shutdown".

## [`backend/backend`](https://github.com/facebook/react-devtools/blob/master/backend/backend.js) (backend)

- Passed the `hook` instance.
- If a `window.React` global exists, the backend injects it.
- Attaches all injected renderers as `hook.helpers`.
- Sets up hook subscriptions for attached renderers (and handles unsubscribing them as well).

## [`agent/Agent`](https://github.com/facebook/react-devtools/blob/master/agent/Agent.js) (backend)

- Lives in the same context as React.
- Generates unique IDs for each React instance and maintains maps of ID-to-instance and instance-to-ID.
- Also manages a map of ID to mounted React Elements.
- Observes events from the backend (root, mount, update, unmount) and forwards them through the Bridge to the frontend.
- Also fires events for things like selection, start/stop inspecting, and highlighting.
- Receives events from the frontend and relays them to the appropriate elements (e.g. set `props` or `state`) or native handles (e.g. set `textContent`).

## [`agent/Bridge`](https://github.com/facebook/react-devtools/blob/master/agent/Bridge.js) (frontend and backend)

- Serializes requests between the backend Agent and the frontend store.
- Batches these requests and flushes them periodically using `requestIdleCallback` to avoid blocking the UI.
- Uses a "wall" (built on top of either [`window.postMessage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) or [`WebSockets`](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)) for serialization.
  - "Cleans" complex data types before sending them through the wall.
  - Reconstructs them on the other side as proxies.
  - Cleaned data can be inspected on the other side by passing an ID and a callback to get more detail.
