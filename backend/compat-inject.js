
module.exports = function compatInject(window) {
  // 0.13
  Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
    value: {
      inject: function(runtime) {
        this._reactRuntime = runtime;
      },
      getSelectedInstance: null,
      Overlay: null,
    }
  });

  // 0.14+
  Object.defineProperty(window, '__REACT_DEVTOOLS_BACKEND__', {
    value: {
      getReactHandleFromNative: null,
      getNativeFromHandle: null,
      injectDevTools: null,
    },
  });
}

