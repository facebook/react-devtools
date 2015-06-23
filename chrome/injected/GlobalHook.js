// Inject a `__REACT_DEVTOOLS_GLOBAL_HOOK__` global so that React can detect that the
// devtools are installed (and skip its suggestion to install the devtools).
var js = (
  // 0.13
  "if (!window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {" +
    "Object.defineProperty(" +
      "window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {value: {" +
        "inject: function(runtime) { this._reactRuntime = runtime; }," +
        "getSelectedInstance: null," +
        "Overlay: null" +
      "}}" +
    ");" +
  "}" +

  // 0.14+
  "Object.defineProperty(window, '__REACT_DEVTOOLS_BACKEND__', {" +
    "value: {" +
      "getReactHandleFromNative: null," +
      "getNativeFromHandle: null," +
      "injectDevTools: null," +
    "}," +
  "});"
);

// This script runs before the <head> element is created, so we add the script
// to <html> instead.
var script = document.createElement('script');
script.textContent = js;
document.documentElement.appendChild(script);
script.parentNode.removeChild(script);
