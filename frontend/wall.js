
module.exports = function () {
  var lefter = null
  var righter = null
  return {
    left: {
      listen(fn) {
        lefter = fn;
      },
      send(data) {
        if (righter) righter(data);
      },
    },

    right: {
      listen(fn) {
        righter = fn;
      },
      send(data) {
        if (lefter) lefter(data);
      },
    },
  }
}

