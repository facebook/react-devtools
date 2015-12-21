/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

var consts = require('./consts');
var hydrate = require('./hydrate');
var dehydrate = require('./dehydrate');
var performanceNow = require('fbjs/lib/performanceNow');

type AnyFn = (...x: any) => any;
export type Wall = {
  listen: (fn: (data: PayloadType) => void) => void,
  send: (data: PayloadType) => void,
};

type EventPayload = {
  type: 'event',
  cleaned: ?Array<Array<string>>,
  evt: string,
  data: any,
};

type PayloadType = {
  type: 'inspect',
  id: string,
  path: Array<string>,
  callback: number,
} | {
  type: 'many-events',
  events: Array<EventPayload>,
} | {
  type: 'call',
  name: string,
  args: Array<any>,
  callback: number,
} | {
  type: 'callback',
  id: number,
  args: Array<any>,
} | {
  type: 'pause',
} | {
  type: 'resume',
} | EventPayload;

/**
 * The bridge is responsible for serializing requests between the Agent and
 * the Frontend Store. It needs to be connected to a Wall object that can send
 * JSONable data to the bridge on the other side.
 *
 * complex data
 *     |
 *     v
 *  [Bridge]
 *     |
 * jsonable data
 *     |
 *     v
 *   [wall]
 *     |
 *     v
 * ~ some barrier ~
 *     |
 *     v
 *   [wall]
 *     |
 *     v
 *  [Bridge]
 *     |
 *     v
 * "hydrated" data
 *
 * When an item is passed in that can't be serialized (anything other than a
 * plain array, object, or literal value), the object is "cleaned", and
 * rehydrated on the other side with `Symbol` attributes indicating that the
 * object needs to be inspected for more detail.
 *
 * Example:
 *
 * bridge.send('evname', {id: 'someid', foo: MyCoolObjectInstance})
 * ->
 * shows up, hydrated as
 * {
 *   id: 'someid',
 *   foo: {
 *     [consts.name]: 'MyCoolObjectInstance',
 *     [consts.type]: 'object',
 *     [consts.meta]: {},
 *     [consts.inspected]: false,
 *   }
 * }
 *
 * The `consts` variables are Symbols, and as such are non-ennumerable.
 * The front-end therefore needs to check for `consts.inspected` on received
 * objects, and can thereby display object proxies and inspect them.
 *
 * Complex objects that are passed are expected to have a top-level `id`
 * attribute, which is used for later lookup + inspection. Once it has been
 * determined that an object is no longer needed, call `.forget(id)` to clean
 * up.
 */
class Bridge {
  _buffer: Array<{evt: string, data: any}>;
  _cbs: Map;
  _cid: number;
  _inspectables: Map;
  _lastTime: number;
  _listeners: {[key: string]: Array<(data: any) => void>};
  _waiting: ?number;
  _wall: Wall;
  _callers: {[key: string]: AnyFn};
  _paused: boolean;

  constructor(wall: Wall) {
    this._cbs = new Map();
    this._inspectables = new Map();
    this._cid = 0;
    this._listeners = {};
    this._buffer = [];
    this._waiting = null;
    this._lastTime = 5;
    this._callers = {};
    this._paused = false;
    this._wall = wall;

    wall.listen(this._handleMessage.bind(this));
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
        data[consts.proto] = proto;
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

  call(name: string, args: Array<any>, cb: (val: any) => any) {
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

  pause() {
    this._wall.send({
      type: 'pause',
    });
  }

  resume() {
    this._wall.send({
      type: 'resume',
    });
  }

  setInspectable(id: string, data: Object) {
    var prev = this._inspectables.get(id);
    if (!prev) {
      this._inspectables.set(id, data);
      return;
    }
    this._inspectables.set(id, {...prev, ...data});
  }

  sendOne(evt: string, data: any) {
    var cleaned = [];
    var san = dehydrate(data, cleaned);
    if (cleaned.length) {
      this.setInspectable(data.id, data);
    }
    this._wall.send({type: 'event', evt, data: san, cleaned});
  }

  send(evt: string, data: any) {
    if (!this._waiting && !this._paused) {
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
    var start = performanceNow();
    var events = this._buffer.map(({evt, data}) => {
      var cleaned = [];
      var san = dehydrate(data, cleaned);
      if (cleaned.length) {
        this.setInspectable(data.id, data);
      }
      return {type: 'event', evt, data: san, cleaned};
    });
    this._wall.send({type: 'many-events', events});
    this._buffer = [];
    this._waiting = null;
    this._lastTime = performanceNow() - start;
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
    var self = this;
    var listener = function() {
      fn.apply(this, arguments);
      self.off(evt, listener);
    };
    this.on(evt, listener);
  }

  _handleMessage(payload: PayloadType) {
    if (payload.type === 'resume') {
      this._paused = false;
      this._waiting = null;
      this.flush();
      return;
    }

    if (payload.type === 'pause') {
      this._paused = true;
      clearTimeout(this._waiting);
      this._waiting = null;
      return;
    }

    if (payload.type === 'callback') {
      var callback = this._cbs.get(payload.id);
      if (callback) {
        callback(...payload.args);
        this._cbs.delete(payload.id);
      }
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
      var fns = this._listeners[payload.evt];
      var data = payload.data;
      if (fns) {
        fns.forEach(fn => fn(data));
      }
    }

    if (payload.type === 'many-events') {
      payload.events.forEach(event => {
        // console.log('[bridge<-]', payload.evt);
        if (event.cleaned) {
          hydrate(event.data, event.cleaned);
        }
        var handlers = this._listeners[event.evt];
        if (handlers) {
          handlers.forEach(fn => fn(event.data));
        }
      });
    }
  }

  _handleCall(name: string, args: Array<any>, callback: number) {
    if (!this._callers[name]) {
      return console.warn('unknown call');
    }
    args = !Array.isArray(args) ? [args] : args;
    var result;
    try {
      result = this._callers[name].apply(null, args);
    } catch (e) {
      console.error('Failed to call', e);
      return undefined;
    }
    this._wall.send({
      type: 'callback',
      id: callback,
      args: [result],
    });
  }

  _inspectResponse(id: string, path: Array<string>, callback: number) {
    var inspectable = this._inspectables.get(id);

    var result = {};
    var cleaned = [];
    var proto = null;
    var protoclean = [];
    if (inspectable) {
      var val = getIn(inspectable, path);
      var protod = false;
      var isFn = typeof val === 'function';
      Object.getOwnPropertyNames(val).forEach(name => {
        if (name === '__proto__') {
          protod = true;
        }
        if (isFn && (name === 'arguments' || name === 'callee' || name === 'caller')) {
          return;
        }
        result[name] = dehydrate(val[name], cleaned, [name]);
      });

      /* eslint-disable no-proto */
      if (!protod && val.__proto__ && val.constructor.name !== 'Object') {
        var newProto = {};
        var pIsFn = typeof val.__proto__ === 'function';
        Object.getOwnPropertyNames(val.__proto__).forEach(name => {
          if (pIsFn && (name === 'arguments' || name === 'callee' || name === 'caller')) {
            return;
          }
          newProto[name] = dehydrate(val.__proto__[name], protoclean, [name]);
        });
        proto = newProto;
      }
      /* eslint-enable no-proto */
    }

    this._wall.send({
      type: 'callback',
      id: callback,
      args: [result, cleaned, proto, protoclean],
    });
  }
}

function getIn(base, path) {
  return path.reduce((obj, attr) => {
    return obj ? obj[attr] : null;
  }, base);
}

module.exports = Bridge;
