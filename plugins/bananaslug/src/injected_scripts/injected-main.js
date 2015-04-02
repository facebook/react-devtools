var MessageType = require('../share/MessageType');
var ReactComponentInjection = require('./ReactComponentInjection');
var constants = require('../share/constants');
var getReactInternals = require('./getReactInternals');
var postDataToScriptInjector = require('./postDataToScriptInjector');

/**
 * The following section contains the modified codes that are originally copied
 * from:
 * https://github.com/facebook/react-devtools/blob/master/injected/ReactHost.js
 */

function onReactInternalsReady(ReactInternals) {
  // Track which component the current breakpoint is in
  // var ReactCurrentOwner = ReactInternals.CurrentOwner;

  // Get top level instances and extract IDs from real DOM nodes
  var ReactMount = ReactInternals.Mount;

  // Use instanceof check to see if this is plain text (can't duck check)
  // var ReactTextComponent = ReactInternals.TextComponent;

  // Used to see if one instance is the ancestor of an instance or dom node
  // var ReactInstanceHandles = ReactInternals.InstanceHandles;

  ReactComponentInjection.ReactMount = ReactMount;

  var {
    componentWillMount,
    componentWillUnmount,
    componentWillUpdate,
  } = ReactComponentInjection;

  var originalMountComponent;
  var originalUpdateComponent;
  var originalUnmountComponent;

  // Monkey patch Components to track rerenders
  if (ReactInternals.Component) {
    // 0.11 - 0.12
    // Monkey patched to track updates
    var ReactComponent = ReactInternals.Component;
    var ComponentMixin = ReactComponent.Mixin;
    originalMountComponent = ComponentMixin.mountComponent;
    originalUpdateComponent = ComponentMixin.updateComponent;
    originalUnmountComponent = ComponentMixin.unmountComponent;

    ComponentMixin.mountComponent = function() {
      var result = originalMountComponent.apply(this, arguments);
      componentWillMount.call(this);
      return result;
    };

    ComponentMixin.updateComponent = function() {
      var result = originalUpdateComponent.apply(this, arguments);
      componentWillUpdate.call(this);
      return result;
    };

    ComponentMixin.unmountComponent = function() {
      var result = originalUnmountComponent.apply(this, arguments);
      componentWillUnmount.call(this);
      return result;
    };


  } else if (ReactInternals.Reconciler) {
    // 0.13+
    var ReactReconciler = ReactInternals.Reconciler;
    var originalPerformUpdateIfNecessary = ReactReconciler.performUpdateIfNecessary;
    var originalReceiveComponent = ReactReconciler.receiveComponent;

    originalMountComponent = ReactReconciler.mountComponent;
    originalUnmountComponent = ReactReconciler.unmountComponent;

    ReactReconciler.mountComponent = function(instance) {
      var result = originalMountComponent.apply(this, arguments);
      componentWillMount.call(instance);
      return result;
    };

    ReactReconciler.performUpdateIfNecessary = function(instance) {
      var result = originalPerformUpdateIfNecessary.apply(this, arguments);
      componentWillUpdate.call(instance);
      return result;
    };

    ReactReconciler.receiveComponent = function(instance) {
      var result = originalReceiveComponent.apply(this, arguments);
      componentWillUpdate.call(instance);
      return result;
    };

    ReactReconciler.unmountComponent = function(instance) {
      var result = originalUnmountComponent.apply(this, arguments);
      componentWillUnmount.call(instance);
      return result;
    };
  }
}

/**
 * @param {boolean} enabled
 */
function bananaslugSetEnabled(enabled) {
  postDataToScriptInjector(MessageType.ENABLED_STATE_CHANGE, enabled);
}

function main() {
  getReactInternals().then(onReactInternalsReady).then(() => {
    var method = constants.GLOBAL_INJECTED_METHOD_SET_ENABLED_NAME;
    global[method] = bananaslugSetEnabled;
  });
}

main();
