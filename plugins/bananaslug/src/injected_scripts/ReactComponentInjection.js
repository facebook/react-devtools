/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var MessageType = require('../share/MessageType');
var postDataToScriptInjector = require('./postDataToScriptInjector');
var shallowCompare = require('../share/shallowCompare');

var {
  requestAnimationFrame,
} = global;

var MIN_MEASUREMENT_DURATION = 500;
var _BananaSlugID = 1;
var _measurementQueue = {};

var KEY_ID = '_BananaSlugID';
var KEY_lastMeasuredInfo = '_BananaSlug_lastMeasuredInfo';
var KEY_lastMeasuredTime = '_BananaSlug_lastMeasuredTime';
var KEY_shouldUpdate = '_BananaSlug_shouldUpdate';
var KEY_originalComponentDidUpdate = '_BananaSlug_originalComponentDidUpdate';

function performScheduledMeasurement() {
  var ii = 0;
  var batchedInfo = {};
  for (var bid in _measurementQueue) {
    if (_measurementQueue.hasOwnProperty(bid)) {

      var component = _measurementQueue[bid];
      var info = measureComponent(component);
      if (info) {
        batchedInfo[bid] = info;
      }
      delete _measurementQueue[bid];
      ii++;
    }
  }
  if (ii > 0) {
    postDataToScriptInjector(
      MessageType.REACT_COMPONENTS_DID_UPDATE,
      batchedInfo
    );
  }
}

/**
 * @param {?Object} component
 * @return {?Node}
 */
function hackReactFindDOMNode(component) {
  // https://facebook.github.io/react/blog/2015/03/10/react-v0.13.html
  // Workaround that mimics API `React.findDOMNod(component)` which
  // internally does this:
  try {
    return (
      ReactComponentInjection.ReactMount.getNodeFromInstance(component) ||
      null
    );
  } catch (ex) {
    return undefined;
  }
}

/**
 * @param {?Object} component
 * @return {?Node}
 */
function getComponentNode(component) {
  if (!component) {
    return null;
  }

  var result = hackReactFindDOMNode(component);
  if (result === undefined) {
    if (component.isMounted && component.getDOMNode) {
      return component.isMounted() ? component.getDOMNode() : null;
    }
  }
  return result;
}

/**
 * @param {Object} component
 * @return {?Object}
 */
function measureComponent(component) {
  var node = getComponentNode(component);
  if (!node || !node.getBoundingClientRect) {
    return null;
  }

  var reactid = node.getAttribute('data-reactid');
  var now = Date.now();
  var info = null;

  var duration = now - (component[KEY_lastMeasuredTime] || 0);

  if (duration < MIN_MEASUREMENT_DURATION) {
    // Measuring is too expensive. Limit the rate.
    info = component[KEY_lastMeasuredInfo];
    if (info.reactid !== reactid) {
      // Invalid cache. Clean up.
      delete component[KEY_lastMeasuredTime];
      delete component[KEY_lastMeasuredInfo];
      info = null;
    }
    info.should_update = component[KEY_shouldUpdate];
  }

  if (info === null) {
    var rect = node.getBoundingClientRect();
    info = {
      should_update: component[KEY_shouldUpdate],
      reactid: reactid,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
    };
    component[KEY_lastMeasuredTime] = now;
    component[KEY_lastMeasuredInfo] = info;
  }

  return info;
}


/**
 * @fileOverview
 * This file is injected into thw native web page.
 */
/**
 * @param {?Object} instance
 * @return {?Object}
 */
function getComponent(instance) {
  if (instance) {
    if (typeof instance.getDOMNode === 'function') {
      return instance;
    }
    if (instance._instance) {
      return instance._instance;
    }
  }
  return null;
}

/**
 * @param {Object} component
 * @param {boolean} shouldUpdate
 */
function scheduleMeasurement(component, shouldUpdate) {
  component[KEY_shouldUpdate] = shouldUpdate;
  _measurementQueue[component[KEY_ID]] = component;
  requestAnimationFrame(performScheduledMeasurement);
}

// export methods //////////////////////////////////////////////////////////////

/**
 * @this Object
 */
function componentWillUpdate() {
  var component = getComponent(this);
  if (!component) {
    return;
  }

  if (!component[KEY_ID]) {
    component[KEY_ID] = 'bs-' + _BananaSlugID++;
    if (component.componentDidUpdate) {
      component[KEY_originalComponentDidUpdate] =
        component.componentDidUpdate;
    }
    component.componentDidUpdate = componentDidUpdate;
  }
}

/**
 * @param {Object} prevProps
 * @param {?Object} prevState
 * @this Object
 */
function componentDidUpdate(prevProps, prevState) {
  var component = getComponent(this);
  if (!component) {
    return;
  }

  if (component[KEY_originalComponentDidUpdate]) {
    component[KEY_originalComponentDidUpdate].call(
      component,
      prevProps,
      prevState
    );
  }

  var shouldUpdate = !shallowCompare(component, prevProps, prevState);
  scheduleMeasurement(component, shouldUpdate);
}

function componentWillMount() {
  var component = getComponent(this);
  if (!component) {
    return;
  }
}

/**
 * @this Object
 */
function componentWillUnmount() {
  var component = getComponent(this);
  if (!component) {
    return;
  }
  delete component[KEY_ID];
  delete component[KEY_lastMeasuredInfo];
  delete component[KEY_lastMeasuredTime];
  delete component[KEY_shouldUpdate];
}

var ReactComponentInjection = {
  ReactMount: null,
  componentWillMount: componentWillMount,
  componentWillUpdate: componentWillUpdate,
  componentDidUpdate: componentDidUpdate,
  componentWillUnmount: componentWillUnmount
};

module.exports = ReactComponentInjection;
