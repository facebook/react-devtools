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

var resolveBoxStyle = require('./resolveBoxStyle');

import type Bridge from '../../agent/Bridge';
import type Agent from '../../agent/Agent';

var styleOverridesByHostComponentId = {};

module.exports = function setupRNStyle(
  bridge: Bridge,
  agent: Agent,
  resolveRNStyle: (style: number) => ?Object,
) {
  bridge.onCall('rn-style:get', id => {
    var node = agent.elementData.get(id);
    if (!node || !node.props) {
      return null;
    }
    return resolveRNStyle(node.props.style);
  });

  bridge.on('rn-style:measure', id => {
    measureStyle(agent, bridge, resolveRNStyle, id);
  });

  bridge.on('rn-style:rename', ({id, oldName, newName, val}) => {
    renameStyle(agent, id, oldName, newName, val);
    setTimeout(() => measureStyle(agent, bridge, resolveRNStyle, id));
  });

  bridge.on('rn-style:set', ({id, attr, val}) => {
    setStyle(agent, id, attr, val);
    setTimeout(() => measureStyle(agent, bridge, resolveRNStyle, id));
  });
};

var blank = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

function measureStyle(agent, bridge, resolveRNStyle, id) {
  var node = agent.elementData.get(id);
  if (!node || !node.props) {
    bridge.send('rn-style:measure', {});
    return;
  }

  let style = resolveRNStyle(node.props.style);
  // If it's a host component we edited before, amend styles.
  if (styleOverridesByHostComponentId[id]) {
    style = Object.assign({}, style, styleOverridesByHostComponentId[id]);
  }

  var instance = node.publicInstance;
  if (!instance || !instance.measure) {
    bridge.send('rn-style:measure', {style});
    return;
  }

  instance.measure((x, y, width, height, left, top) => {
    // RN Android sometimes returns undefined here. Don't send measurements in this case.
    // https://github.com/jhen0409/react-native-debugger/issues/84#issuecomment-304611817
    if (typeof x !== 'number') {
      bridge.send('rn-style:measure', {style});
      return;
    }
    var margin = (style && resolveBoxStyle('margin', style)) || blank;
    var padding = (style && resolveBoxStyle('padding', style)) || blank;
    bridge.send('rn-style:measure', {
      style,
      measuredLayout: {
        x,
        y,
        width,
        height,
        left,
        top,
        margin,
        padding,
      },
    });
  });
}

function shallowClone(obj) {
  var nobj = {};
  for (var n in obj) {
    nobj[n] = obj[n];
  }
  return nobj;
}

function renameStyle(agent, id, oldName, newName, val) {
  var data = agent.elementData.get(id);
  var newStyle = newName
    ? {[oldName]: undefined, [newName]: val}
    : {[oldName]: undefined};

  if (data && data.updater && typeof data.updater.setInProps === 'function') {
    // First attempt: use setInProps().
    // We do this for composite components, and it works relatively well.
    var style = data && data.props && data.props.style;
    var customStyle;
    if (Array.isArray(style)) {
      var lastLength = style.length - 1;
      if (typeof style[lastLength] === 'object' && !Array.isArray(style[lastLength])) {
        customStyle = shallowClone(style[lastLength]);
        delete customStyle[oldName];
        if (newName) {
          customStyle[newName] = val;
        } else {
          customStyle[oldName] = undefined;
        }
        // $FlowFixMe we know that updater is not null here
        data.updater.setInProps(['style', lastLength], customStyle);
      } else {
        style = style.concat([newStyle]);
        // $FlowFixMe we know that updater is not null here
        data.updater.setInProps(['style'], style);
      }
    } else {
      if (typeof style === 'object') {
        customStyle = shallowClone(style);
        delete customStyle[oldName];
        if (newName) {
          customStyle[newName] = val;
        } else {
          customStyle[oldName] = undefined;
        }
        // $FlowFixMe we know that updater is not null here
        data.updater.setInProps(['style'], customStyle);
      } else {
        style = [style, newStyle];
        data.updater.setInProps(['style'], style);
      }
    }
  } else if (data && data.updater && typeof data.updater.setNativeProps === 'function') {
    // Fallback: use setNativeProps(). We're dealing with a host component.
    // Remember to "correct" resolved styles when we read them next time.
    if (!styleOverridesByHostComponentId[id]) {
      styleOverridesByHostComponentId[id] = newStyle;
    } else {
      Object.assign(styleOverridesByHostComponentId[id], newStyle);
    }
    data.updater.setNativeProps({ style: newStyle });
  } else {
    return;
  }
  agent.emit('hideHighlight');
}

function setStyle(agent, id, attr, val) {
  var data = agent.elementData.get(id);
  var newStyle = {[attr]: val};

  if (data && data.updater && typeof data.updater.setInProps === 'function') {
    // First attempt: use setInProps().
    // We do this for composite components, and it works relatively well.
    var style = data.props && data.props.style;
    if (Array.isArray(style)) {
      var lastLength = style.length - 1;
      if (typeof style[lastLength] === 'object' && !Array.isArray(style[lastLength])) {
        // $FlowFixMe we know that updater is not null here
        data.updater.setInProps(['style', lastLength, attr], val);
      } else {
        style = style.concat([newStyle]);
        // $FlowFixMe we know that updater is not null here
        data.updater.setInProps(['style'], style);
      }
    } else {
      style = [style, newStyle];
      data.updater.setInProps(['style'], style);
    }
  } else if (data && data.updater && typeof data.updater.setNativeProps === 'function') {
    // Fallback: use setNativeProps(). We're dealing with a host component.
    // Remember to "correct" resolved styles when we read them next time.
    if (!styleOverridesByHostComponentId[id]) {
      styleOverridesByHostComponentId[id] = newStyle;
    } else {
      Object.assign(styleOverridesByHostComponentId[id], newStyle);
    }
    data.updater.setNativeProps({ style: newStyle });
  } else {
    return;
  }
  agent.emit('hideHighlight');
}
