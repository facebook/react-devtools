
var weakCereal = require('./weak-cereal');
var consts = require('./consts');

function sanitize(data, path, cleaned) {
  if ('function' === typeof data) {
    cleaned.push(path);
    return {
      name: data.name,
      type: 'function',
      preview: data + '',
    };
  }
  if (!data || 'object' !== typeof data) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item, i) => sanitize(item, path.concat([i]), cleaned));
  }
  // TODO when this is in the iframe window, we can just use Object
  if (data.constructor && data.constructor.name !== 'Object') {
    cleaned.push(path);
    return {
      name: data.constructor.name,
      type: 'object',
    };
  }
  var res = {};
  for (var name in data) {
    res[name] = sanitize(data[name], path.concat([name]), cleaned);
  }
  return res;
}

class Bridge {
  constructor() {
    this.data = new Map();
    this.cbs = new Map();
    this.listeners = {};
    this.cid = 0;
  }

  attach(wall) {
    this.wall = wall
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
    try {
      this.wall.send({type: 'event', evt, data});
    } catch (e) {
      var cleaned = [];
      var san = sanitize(data, [], cleaned)
      console.log('san', san, cleaned)
      this.wall.send({type: 'event', evt, data: san, cleaned});
    }
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
      if (payload.cleaned) {
        hydrate(payload.data, payload.cleaned, consts.PENDING);
      }
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

function hydrate(data, cleaned, pending) {
  cleaned.forEach(path => {
    var last = path.pop();
    var obj = path.reduce((obj, attr) => obj ? obj[attr] : null, data);
    var replace = {};
    replace[consts.name] = obj[last].name;
    replace[consts.type] = obj[last].type;
    replace[consts.preview] = obj[last].preview;
    obj[last] = replace;
  });
}

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
