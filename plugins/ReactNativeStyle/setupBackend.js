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

import type Bridge from '../../agent/Bridge';
import type Agent from '../../agent/Agent';

module.exports = function setupRNStyle(bridge: Bridge, agent: Agent, resolveRNStyle: (style: number) => ?Object) {
  bridge.onCall('rn-style:get', id => {
    var node = agent.elementData.get(id);
    if (!node || !node.props) {
      return null;
    }
    return resolveRNStyle(node.props.style);
  });

  bridge.on('rn-style:rename', ({id, oldName, newName, val}) => {
    renameStyle(agent, id, oldName, newName, val);
  });

  bridge.on('rn-style:set', ({id, attr, val}) => {
    setStyle(agent, id, attr, val);
  });
};

function shallowClone(obj) {
  var nobj = {};
  for (var n in obj) {
    nobj[n] = obj[n];
  }
  return nobj;
}

function renameStyle(agent, id, oldName, newName, val) {
  var data = agent.elementData.get(id);
  var newStyle = {[newName]: val};
  if (!data || !data.updater || !data.updater.setInProps) {
    if (data && data.updater && data.updater.setNativeProps) {
      data.updater.setNativeProps({ style: newStyle });
    } else {
      // <hack>
      // We can remove this when we stop supporting RN versions
      // before https://github.com/facebook/react-devtools/pull/528.
      // Newer versions use `updater.setNativeProps` instead.
      var el = agent.reactElements.get(id);
      if (el && el.setNativeProps) {
        el.setNativeProps({ style: newStyle });
      } else {
        console.error('Unable to set style for this element... (no forceUpdate or setNativeProps)');
      }
      // </hack>
    }
    return;
  }
  var style = data && data.props && data.props.style;
  var customStyle;
  if (Array.isArray(style)) {
    if (typeof style[style.length - 1] === 'object' && !Array.isArray(style[style.length - 1])) {
      customStyle = shallowClone(style[style.length - 1]);
      delete customStyle[oldName];
      customStyle[newName] = val;
      // $FlowFixMe we know that updater is not null here
      data.updater.setInProps(['style', style.length - 1], customStyle);
    } else {
      style = style.concat([newStyle]);
      // $FlowFixMe we know that updater is not null here
      data.updater.setInProps(['style'], style);
    }
  } else {
    if (typeof style === 'object') {
      customStyle = shallowClone(style);
      delete customStyle[oldName];
      customStyle[newName] = val;
      // $FlowFixMe we know that updater is not null here
      data.updater.setInProps(['style'], customStyle);
    } else {
      style = [style, newStyle];
      data.updater.setInProps(['style'], style);
    }
  }
  agent.emit('hideHighlight');
}

function setStyle(agent, id, attr, val) {
  var data = agent.elementData.get(id);
  var newStyle = {[attr]: val};
  if (!data || !data.updater || !data.updater.setInProps) {
    if (data && data.updater && data.updater.setNativeProps) {
      data.updater.setNativeProps({ style: newStyle });
    } else {
      // <hack>
      // We can remove this when we stop supporting RN versions
      // before https://github.com/facebook/react-devtools/pull/528.
      // Newer versions use `updater.setNativeProps` instead.
      var el = agent.reactElements.get(id);
      if (el && el.setNativeProps) {
        el.setNativeProps({ style: newStyle });
      } else {
        console.error('Unable to set style for this element... (no forceUpdate or setNativeProps)');
      }
      // </hack>
    }
    return;
  }
  var style = data.props && data.props.style;
  if (Array.isArray(style)) {
    if (typeof style[style.length - 1] === 'object' && !Array.isArray(style[style.length - 1])) {
      // $FlowFixMe we know that updater is not null here
      data.updater.setInProps(['style', style.length - 1, attr], val);
    } else {
      style = style.concat([newStyle]);
      // $FlowFixMe we know that updater is not null here
      data.updater.setInProps(['style'], style);
    }
  } else {
    style = [style, newStyle];
    data.updater.setInProps(['style'], style);
  }
  agent.emit('hideHighlight');
}
