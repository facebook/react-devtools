
var weakCereal = require('./weak-cereal');
var consts = require('./consts');

class Bridge {
  constructor() {
    this.cbs = new Map();
    this.listeners = {};
    this.inspectables = new Map();
    this.cid = 0;
  }

  attach(wall) {
    this.wall = wall
    this.wall.listen(this._handleMessage.bind(this));
  }

  inspect(id, path, cb) {
    var cid = this.cid++;
    this.cbs.set(cid, (data, cleaned, proto, protoclean) => {
      if (cleaned.length) {
        hydrate(data, cleaned);
      }
      if (proto && protoclean.length) {
        hydrate(proto, protoclean);
      }
      if (proto) {
        data[consts.proto] = proto
      }
      cb(data);
    });

    this.wall.send({
      type: 'inspect',
      callback: cid,
      path,
      id,
    });
  }

  send(evt, data) {
    var cleaned = [];
    var san = sanitize(data, [], cleaned)
    if (cleaned.length) {
      this.inspectables.set(data.id, data);
    }
    this.wall.send({type: 'event', evt, data: san, cleaned});
  }

  forget(id) {
    this.inspectables.delete(id);
  }

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

    if (type === 'event') {
      if (payload.cleaned) {
        hydrate(payload.data, payload.cleaned);
      }
      var fns = this.listeners[payload.evt]
      if (fns) {
        fns.forEach(fn => fn(payload.data));
      }
    }
  }

  _inspectResponse(id, path, callback) {
    var val = getIn(this.inspectables.get(id), path);
    var result = {};
    var cleaned = [];
    var proto = null;
    var protoclean = [];
    if (val) {
      var protod = false
      var isFn = typeof val === 'function'
      Object.getOwnPropertyNames(val).forEach(name => {
        if (name === '__proto__') {
          protod = true;
        }
        if (isFn && (name === 'arguments' || name === 'callee' || name === 'caller')) {
          return;
        }
        result[name] = sanitize(val[name], [name], cleaned);
      });

      if (!protod && val.__proto__) {
        proto = {};
        var pIsFn = typeof val.__proto__ === 'function'
        Object.getOwnPropertyNames(val.__proto__).forEach(name => {
          if (pIsFn && (name === 'arguments' || name === 'callee' || name === 'caller')) {
            return;
          }
          proto[name] = sanitize(val.__proto__[name], [name], protoclean);
        });
      }
    }

    this.wall.send({
      type: 'callback',
      id: callback,
      args: [result, cleaned, proto, protoclean],
    });
  }

}

function hydrate(data, cleaned) {
  cleaned.forEach(path => {
    var last = path.pop();
    var obj = path.reduce((obj, attr) => obj ? obj[attr] : null, data);
    var replace = {};
    replace[consts.name] = obj[last].name;
    replace[consts.type] = obj[last].type;
    replace[consts.inspected] = false;
    obj[last] = replace;
  });
}

function sanitize(data, path, cleaned) {
  if ('function' === typeof data) {
    cleaned.push(path);
    return {
      name: data.name,
      type: 'function',
    };
  }
  if (!data || 'object' !== typeof data) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item, i) => sanitize(item, path.concat([i]), cleaned));
  }
  // TODO when this is in the iframe window, we can just use Object
  if (data.constructor && 'function' === typeof data.constructor && data.constructor.name !== 'Object') {
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

function getIn(obj, path) {
  return path.reduce((obj, attr) => {
    return obj ? obj[attr] : null;
  }, obj);
}

module.exports = Bridge;
