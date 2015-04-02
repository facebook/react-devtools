var MessageType = require('../share/MessageType');
var postDataToScriptInjector = require('./postDataToScriptInjector');
var shallowCompare = require('../share/shallowCompare');

var {
  requestAnimationFrame,
} = global;

var MIN_MEASUREMENT_DURATION = 500;
var _BananaSlugID = 1;
var _measurementQueue = {};

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

  var duration = now - (component._BananaSlug_lastMeasuredTime || 0);

  if (duration < MIN_MEASUREMENT_DURATION) {
    // Measuring is too expensive. Limit the rate.
    info = component._BananaSlug_lastMeasuredInfo;
    if (info.reactid !== reactid) {
      // Invalid cache. Clean up.
      delete component._BananaSlug_lastMeasuredTime;
      delete component._BananaSlug_lastMeasuredInfo;
      info = null;
    }
    info.should_update = component._BananaSlug_shouldUpdate;
  }

  if (info === null) {
    var rect = node.getBoundingClientRect();
    info = {
      should_update: component._BananaSlug_shouldUpdate,
      reactid: reactid,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
    };
    component._BananaSlug_lastMeasuredTime = now;
    component._BananaSlug_lastMeasuredInfo = info;
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
  component._BananaSlug_shouldUpdate = shouldUpdate;
  _measurementQueue[component._BananaSlugID] = component;
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

  if (!component._BananaSlugID) {
    component._BananaSlugID = 'bs-' + _BananaSlugID++;
    if (component.componentDidUpdate) {
      component._originalComponentDidUpdate = component.componentDidUpdate;
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

  if (component._originalComponentDidUpdate) {
    component._originalComponentDidUpdate.call(component, prevProps, prevState);
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
}

var ReactComponentInjection = {
  ReactMount: null,
  componentWillMount: componentWillMount,
  componentWillUpdate: componentWillUpdate,
  componentDidUpdate: componentDidUpdate,
  componentWillUnmount: componentWillUnmount
};

module.exports = ReactComponentInjection;
