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
 * This is the bridge that talks to the ReactInspectorRuntime. This executes
 * in any of the web inspector pages, and injects the runtime into the inspected
 * page context.
 */

var ReactInspectorAgent;

(function() {

var MISSING_RUNTIME =
  'missingRuntime$' + Math.random().toString(36).slice(2);
var RUNTIME_NAMESPACE = '__REACT_INSPECTOR_RUNTIME__' + ReactInspectorVersion;

var queuedCallbacks = null;

function runtimeLoaded(result, isException) {
  var callbacks = queuedCallbacks;
  queuedCallbacks = null;
  for (var i = 0; i < callbacks.length; i++) {
    callbacks[i](isException);
  }
  InspectorBackend.notifyDOM('documentUpdated');
  DOMAgent.initialize();
}

function loadRuntime() {
  var moduleScripts = {};
  var moduleDependencies = {};
  var pending = 0;

  function fetch(fileName, options) {
    var xhr = new XMLHttpRequest();
    pending++;
    xhr.onload = function() {
      if (options.onLoad) {
        options.onLoad.call(null, xhr);
      }
      pending--;
      if (pending == 0){
        complete();
      }
    }
    var runtimeURL = chrome.extension.getURL(fileName);
    xhr.open('GET', runtimeURL, true);
    xhr.send();
  }

  function fetchScript(name, fileName, dependency) {
    moduleDependencies[name] = dependency;
    fetch(fileName, {
      onLoad: function(xhr) {
        moduleScripts[name] = xhr.responseText;
      }
    });
  }

  function fetchContents(name, fileName) {
    fetch(fileName, {
      onLoad: function(xhr) {
        chrome.devtools.inspectedWindow.eval("this." + name + " = "  +
          JSON.stringify(xhr.responseText) + ";");
      }
    });
  }

  function complete() {
    var script = RUNTIME_NAMESPACE + ' = { React: ' + moduleScripts['React'] + '() };\n\n';
    for (var name in moduleDependencies) {
      if (name === 'React') continue;
      var dependencies = (moduleDependencies[name] || []).map(function(dep) {
        return RUNTIME_NAMESPACE + '.' + dep;
      });
      dependencies.push('this', '"' + RUNTIME_NAMESPACE + '"');
      script += RUNTIME_NAMESPACE + '.' + name + ' = ' + moduleScripts[name] +
                '(' + dependencies + ')\n\n';
    }
    // Uncomment this to get debugging support of the devtools internals.
    // script += '//@ sourceURL=InjectedRuntime.js';
    chrome.devtools.inspectedWindow.eval(script, runtimeLoaded);
  }

  fetchScript('React', '/injected/ReactHost.js');
  fetchScript('_injectedScriptHost', '/injected/InjectedScriptHost.js');
  fetchScript('_injectedScript', '/blink/Source/core/inspector/InjectedScriptSource.js', ['_injectedScriptHost']);
  fetchScript('Runtime', '/injected/RuntimeHost.js', ['React', '_injectedScript']);
  fetchScript('Overlay', '/injected/Overlay.js', ['React']);
  fetchScript('DOM', '/injected/DOMHost.js', ['React', 'Overlay', '_injectedScript']);
  fetchContents('__InspectorOverlayPage_html', '/blink/Source/core/inspector/InspectorOverlayPage.html');
}

ReactInspectorAgent = {

  initialize: function(callback) {
    // Reset any existing runtime on the page
    ReactInspectorAgent.call('DOM.reset', function(result, error) {
      callback(error);
    });
  },

  whenReady: function(callback) {
    if (queuedCallbacks) {
      queuedCallbacks.push(callback);
      return;
    }
    ReactInspectorAgent.eval('isReady', function(result, error) {
      callback(error);
    });
  },

  call: function(methodName, callback) {
    var methodSignature = methodName + '(';
    for (var i = 1; i < arguments.length - 1; i++) {
      if (i > 1) methodSignature += ',';
      methodSignature += JSON.stringify(arguments[i]);
    }
    methodSignature += ')';
    ReactInspectorAgent.eval(methodSignature, arguments[arguments.length - 1]);
  },

  eval: function(methodSignature, callback) {
    function retry(error) {
      if (error) {
        // If we still fail, let's error out
        callback(null, error);
      } else {
        // If we successfully reloaded the runtime, let's try again
        ReactInspectorAgent.eval(methodSignature, callback);
      }
    }

    if (queuedCallbacks) {
      queuedCallbacks.push(retry);
      return;
    }

    chrome.devtools.inspectedWindow.eval(
      'typeof ' + RUNTIME_NAMESPACE + ' === "object" ? ' +
        RUNTIME_NAMESPACE + '.' + methodSignature + ' : ' +
        JSON.stringify(MISSING_RUNTIME),
      function(result, error) {
        if (result === MISSING_RUNTIME) {
          // Runtime is missing, let's reload it
          if (queuedCallbacks) {
            queuedCallbacks.push(retry);
          } else {
            queuedCallbacks = [retry];
            loadRuntime();
          }
        } else {
          callback(result, error);
        }
      }
    );
  }

};

})();
