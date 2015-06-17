
module.exports = function (parent, child) {
  var lefter = null
  var righter = null
  return {
    parent: {
      listen(fn) {
        parent.addEventListener('message', evt => fn(evt.data));
      },
      send(data) {
        child.postMessage(data, '*');
      },
    },

    child: {
      listen(fn) {
        child.addEventListener('message', evt => fn(evt.data));
      },
      send(data) {
        child.parent.postMessage(data, '*');
      },
    },
  }
}

