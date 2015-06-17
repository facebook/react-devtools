
module.exports = function () {
  var lefter = null
  var righter = null
  return {
    parent: {
      listen(fn) {
        lefter = fn;
      },
      send(data) {
        if (righter) righter(data);
      },
    },

    child: {
      listen(fn) {
        righter = fn;
      },
      send(data) {
        if (lefter) lefter(data);
      },
    },
  }
}

