/**
 * Copyright (c) 2013-2014, Facebook, Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *  * Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 *  * Neither the name Facebook nor the names of its contributors may be used to
 *    endorse or promote products derived from this software without specific
 *    prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

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
