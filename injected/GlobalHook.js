// Inject a `__REACT_DEVTOOLS_GLOBAL_HOOK__` global so that React can detect that the
// devtools are installed (and skip its suggestion to install the devtools).
var js = (
  "Object.defineProperty(" +
    "window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {value: {" +
      "inject: function(runtime) { this._reactRuntime = runtime; }," +
      "getSelectedInstance: null," +
      "Overlay: null" +
    "}}" +
  ")"
);

// This script runs before the <head> element is created, so we add the script
// to <html> instead.
var script = document.createElement('script');
script.textContent = js;
document.documentElement.appendChild(script);
script.parentNode.removeChild(script);
