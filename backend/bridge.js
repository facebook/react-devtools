
var weakCereal = require('./weak-cereal');

class Bridge {
  constructor(wall) {
    this.wall = wall
    this.data = new Map();
    this.cbs = new Map();
    this.listeners = {};
    this.cid = 0;
    this.wall.listen(this._handleMessage.bind(this));
  }

  inspect(id, path, cb) {
    var cid = this.cid++;
    this.cbs.set(cid, cb);
    this.wall.send({
      type: 'inspect',
      callback: cid,
      path,
    });
  }

  send(evt, data) {
    this.wall.send({type: 'event', evt, data});
  }

  /*
  sendComplex(evt, id, data, complex) {
    this.data.set(id, data);
    this.wall.send({
      data: weakCereal(data, 2)
      type: 'complex',
      evt,
      id,
    });
  }

  forgetComplex(id) {
    this.data.delete(id);
  }
  */

  on(evt, fn) {
    if (!this.listeners[evt]) {
      this.listeners[evt] = [fn];
    } else {
      this.listeners[evt].push(fn);
    }
  }

  _handleMessage(payload) {
    var type = payload.type;
    if (type === 'callback') {
      this.cbs.get(payload.id).apply(null, payload.args);
      this.cbs.delete(payload.id);
      return;
    }

    if (type === 'inspect') {
      this._inspectResponse(payload.id, payload.path, payload.callback);
      return;
    }

    /*
    if (type === 'complex') {
      var fns = this.listeners[payload.evt];
      var data = hydrate(payload.data, 2);
      if (fns) {
        fns.forEach(fn => fn(payload.id, data));
      }
    }
    */

    if (type === 'event') {
      var fns = this.listeners[payload.evt]
      if (fns) {
        fns.forEach(fn => fn(payload.data));
      }
    }
  }

  /*
  _inspectResponse(id, path, callback) {
    this.wall.send({
      type: 'callback',
      id: payload.callback,
      args: [weakCereal(getIn(this.data.get(id), path))],
    });
  }
  */

}

Bridge.PENDING = function PENDING(){};

/*
function hydrate(data, level) {
  var result = {}
  for (var name in data) {
    if ('object' === typeof data[name]) {
      if (level > 1) {
        result[name] = hydrate(data[name], level - 1);
      } else {
        result[name] = Bridge.PENDING;
      }
    } else {
      result[name] = data[name];
    }
  }
  return result;
}

function getIn(obj, path) {
  return path.reduce((obj, attr) => {
    return obj ? obj[attr] : null;
  }, obj);
}
*/

module.exports = Bridge;
