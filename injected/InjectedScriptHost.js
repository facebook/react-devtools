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

/**
 * This stubs out a host environment used by the InjectedScriptSource module,
 * in the inspector package.
 */

(function(ReactHost, inspectedWindow, injectedScriptId) {

var InjectedScriptHost = {

  storageId: function(object) { console.warn('Host:storageId'); },
  getInternalProperties: function(object) { console.warn('Host:setInternalProperties'); },

  functionDetails: function(func) { console.warn('Host:functionDetails'); },

  isHTMLAllCollection: function(object) { return false; },

  internalConstructorName: function(object) {
    if (typeof object.constructor === 'function') {
      if (object.constructor.displayName) {
        return object.constructor.displayName;
      }
      if (object.constructor.name) {
        return object.constructor.name;
      }
    }
    if (typeof object.tagName === 'string') {
      return object.tagName.toLowerCase();
    }
    var name = Object.prototype.toString.call(object);
    return name.substring(8, name.length - 1);
  },

  copyText: function(object) { console.warn('Host:copyText') },
  clearConsoleMessages: function() { console.warn('Host:clearConsoleMessages'); },

  inspectedObject: function(index) { console.warn('Host:inspectedObject'); },

  databaseId: function(object) { console.warn('Host:databaseId'); },

  inspect: function(object, hints) { console.warn('Host:inspect'); },

  type: function(object) {
    // TODO: For DOM nodes and components return 'node'
    switch (Object.prototype.toString.call(object)) {
      case '[object Array]':
        return 'array';
      case '[object Date]':
        return 'date';
      case '[object RegExp]':
        return 'regexp';
      default:
        return null;
    }
  },

  getEventListeners: function(object) { console.warn('Host:getEventListeners'); },

  evaluate: function(expression) {
    return eval(expression);
  },

  debugFunction: function(fn) { console.warn('Host:debugFunction'); },
  undebugFunction: function(fn) { console.warn('Host:undebugFunction'); },

  monitorFunction: function(fn) { console.warn('Host:monitorFunction'); },
  unmonitorFunction: function(fn) { console.warn('Host:unmonitorFunction'); },

  setFunctionVariableValue: function(fun, scopeNumber, variableName, newValue) {
    console.warn('Host:setFunctionVariableValue');
  }

};

return InjectedScriptHost;

})
