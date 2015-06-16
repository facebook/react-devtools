
module.exports = function inject(backend, window, enabled) {

  window.__REACT_DEVTOOLS_BACKEND__ = {
    setEnabled: null, // react should set this. calling with (true) will turn on tracking
    onMounted: backend.onMounted.bind(backend),
    onUpdated: backend.onUpdated.bind(backend),
    onUnmounted: backend.onUnmounted.bind(backend),
    addRoot: backend.addRoot.bind(backend),
    _backend: backend,
    enabled: true,
  }

  backend.setEnabled = val => window.__REACT_DEVTOOLS_BACKEND__.setEnabled(val)

}


