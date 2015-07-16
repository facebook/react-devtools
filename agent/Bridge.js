/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @ xx flow see $FlowFixMe
 */
'use strict';

var consts = require('./consts');
var hydrate = require('./hydrate');
var sanitize = require('./sanitize');

declare var performance: {
  now: () => number,
};

type AnyFn = (...x: any) => any;
type Wall = {
  listen: (fn: (data: any) => void) => void,
  send: (data: any) => void,
};

// $FlowFixMe disjoint unions don't seem to be working
type PayloadType = {
  type: 'inspect',
  id: string,
  path: Array<string>,
  callback: number,
} | {
  type: 'many-events',
  events: Array<Object>,
} | {
  type: 'call',
  name: string,
  callback: number,
} | {
  type: 'callback',
  id: string,
  args: [Object, Object, Object, Object], // Array<Object>,
} | {
  type: 'event',
  cleaned: ?Array<Array<string>>,
  evt: string,
  data: any,
};

class Bridge {
  _buffer: Array<Object>;
  _cbs: Map;
  _cid: number;
  _inspectables: Map;
  _lastTime: number;
  _listeners: Object;
  _waiting: ?number;
  _wall: Object;
  _callers: Object;

  constructor() {
    this._cbs = new Map();
    this._inspectables = new Map();
    this._cid = 0;
    this._listeners = {};
    this._buffer = [];
    this._waiting = null;
    this._lastTime = 5;
    this._callers = {};
  }

  attach(wall: Wall) {
    this._wall = wall
    this._wall.listen(this._handleMessage.bind(this));
  }

  inspect(id: string, path: Array<string>, cb: (val: any) => any) {
    var _cid = this._cid++;
    this._cbs.set(_cid, (data, cleaned, proto, protoclean) => {
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

    this._wall.send({
      type: 'inspect',
      callback: _cid,
      path,
      id,
    });
  }

  call(name: string, args: any | Array<any>, cb: (val: any) => any) {
    var _cid = this._cid++;
    this._cbs.set(_cid, cb);

    this._wall.send({
      type: 'call',
      callback: _cid,
      args,
      name,
    });
  }

  onCall(name: string, handler: (data: any) => any) {
    if (this._callers[name]) {
      throw new Error('only one call handler per call name allowed');
    }
    this._callers[name] = handler;
  }

  sendOne(evt: string, data: any) {
    var cleaned = [];
    var start = performance.now();
    var san = sanitize(data, [], cleaned)
    if (cleaned.length) {
      this._inspectables.set(data.id, data);
    }
    this._wall.send({type: 'event', evt, data: san, cleaned});
  }

  send(evt: string, data: any) {
    if (!this._waiting) {
      this._buffer = [];
      var nextTime = this._lastTime * 3;
      if (nextTime > 500) {
        // flush is taking an unexpected amount of time
        nextTime = 500;
      }
      this._waiting = setTimeout(() => {
        this.flush();
        this._waiting = null;
      }, nextTime);
    }
    this._buffer.push({evt, data});
  }

  flush() {
    var start = performance.now();
    var events = this._buffer.map(({evt, data}) => {
      var cleaned = [];
      var san = sanitize(data, [], cleaned)
      if (cleaned.length) {
        this._inspectables.set(data.id, data);
      }
      return {type: 'event', evt, data: san, cleaned};
    });
    this._wall.send({type: 'many-events', events});
    this._buffer = [];
    this._waiting = null;
    this._lastTime = performance.now() - start
  }

  forget(id: string) {
    this._inspectables.delete(id);
  }

  on(evt: string, fn: AnyFn) {
    if (!this._listeners[evt]) {
      this._listeners[evt] = [fn];
    } else {
      this._listeners[evt].push(fn);
    }
  }

  off(evt: string, fn: AnyFn) {
    if (!this._listeners[evt]) {
      return;
    }
    var ix = this._listeners[evt].indexOf(fn);
    if (ix !== -1) {
      this._listeners[evt].splice(ix, 1);
    }
  }

  once(evt: string, fn: AnyFn) {
    var bridge = this;
    var listener = function () {
      fn.apply(this, arguments);
      bridge.off(evt, listener);
    }
    this.on(evt, listener);
  }

  _handleMessage(payload: PayloadType) {
    var type = payload.type;
    if (payload.type === 'callback') {
      var [data, cleaned, proto, protoclean] = payload.args;
      this._cbs.get(payload.id)(data, cleaned, proto, protoclean);
      this._cbs.delete(payload.id);
      return;
    }

    if (payload.type === 'call') {
      this._handleCall(payload.name, payload.args, payload.callback);
      return;
    }

    if (payload.type === 'inspect') {
      this._inspectResponse(payload.id, payload.path, payload.callback);
      return;
    }

    if (payload.type === 'event') {
      // console.log('[bridge<-]', payload.evt);
      if (payload.cleaned) {
        hydrate(payload.data, payload.cleaned);
      }
      var fns = this._listeners[payload.evt]
      if (fns) {
        fns.forEach(fn => fn(payload.data));
      }
    }

    if (payload.type === 'many-events') {
      payload.events.forEach(payload => {
        // console.log('[bridge<-]', payload.evt);
        if (payload.cleaned) {
          hydrate(payload.data, payload.cleaned);
        }
        var fns = this._listeners[payload.evt]
        if (fns) {
          fns.forEach(fn => fn(payload.data));
        }
      });
    }
  }

  _handleCall(name, args, callback) {
    if (!this._callers[name]) {
      return console.warn('unknown call');
    }
    var args = args;
    if (!Array.isArray(args)) {
      args = [args];
    }
    var result;
    try {
      result = this._callers[name].apply(null, args);
    } catch (e) {
      console.error('Failed to call', e);
      return;
    }
    this._wall.send({
      type: 'callback',
      id: callback,
      args: [result],
    });
  }

  _inspectResponse(id: string, path: Array<string>, callback: number) {
    var val = getIn(this._inspectables.get(id), path);
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
        // $FlowFixMe flow thinks `val` might be null
        result[name] = sanitize(val[name], [name], cleaned);
      });

      if (!protod && val.__proto__ && val.constructor.name !== 'Object') {
        proto = {};
        var pIsFn = typeof val.__proto__ === 'function'
        Object.getOwnPropertyNames(val.__proto__).forEach(name => {
          if (pIsFn && (name === 'arguments' || name === 'callee' || name === 'caller')) {
            return;
          }
          // $FlowFixMe flow thinks proto (and val) might be null
          proto[name] = sanitize(val.__proto__[name], [name], protoclean);
        });
      }
    }

    this._wall.send({
      type: 'callback',
      id: callback,
      args: [result, cleaned, proto, protoclean],
    });
  }

}

function getIn(obj, path) {
  return path.reduce((obj, attr) => {
    return obj ? obj[attr] : null;
  }, obj);
}

module.exports = Bridge;
