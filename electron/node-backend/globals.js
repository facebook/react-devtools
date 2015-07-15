
global.performance = {
  now: function () {
    return Date.now();
  },
}

// 0.13
Object.defineProperty(global, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {value: {
    inject: function(runtime) { this._reactRuntime = runtime; },
    getSelectedInstance: null,
    Overlay: null
  }}
);

