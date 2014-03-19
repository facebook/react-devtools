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
 * This simulates the native DOMAgent. It exposes React component as if they
 * where XML DOMNodes so that the Web Inspector can render them in a tree form.
 */

var DOMAgent = {

  getDocument: function(callback) {
    ReactInspectorAgent.call('DOM.getDocument',
      function(result, error) {
        callback(error, result);
      }
    );
  },

  requestChildNodes: function(nodeId, depth, callback) {
    ReactInspectorAgent.call('DOM.getChildNodes',
      nodeId,
      depth,
      function(result, error) {
        if (error) {
          callback(error);
          return;
        }
        InspectorBackend.notifyDOM('setChildNodes', [nodeId, result]);
        callback(null);
      }
    );
  },

  getAttributes: function(nodeId, callback) {
    // Not yet needed
  },

  getEventListenersForNode: function(id, objectGroupId, callback) {
    ReactInspectorAgent.call('DOM.getEventListenersForNode', id, objectGroupId,
      function(result, error) {
        callback(error, result);
      }
    );
  },

  // From and to JS runtime instances

  requestNode: function(objectId, callback) {
    // TODO
  },

  resolveNode: function(nodeId, objectGroup, callback) {
    ReactInspectorAgent.call('DOM.resolveNode', nodeId, objectGroup,
      function(result, error) {
        callback(error, result);
      }
    );
  },

  pushNodeByPathToFrontend: function(path, callback) {
    ReactInspectorAgent.call('DOM.getNodeForPath', path,
      function(result, error) {
        if (error) {
          callback(error);
          return;
        }
        var changeLog = result.changeLog;
        for (var i = 0; i < changeLog.length; i++) {
          var change = changeLog[i];
          InspectorBackend.notifyDOM(change.method, change.args);
        }
        callback(null, result.node ? result.node.nodeId : 0);
      }
    );
  },

  // ???

  setInspectModeEnabled: function() {},

  // Search
  performSearch: function(query, callback) {},
  getSearchResults: function(searchId, index, index2, callback) {},
  querySelector: function(nodeId, selectors, callback) {},
  querySelectorAll: function(nodeId, selectors, callback){},

  // Undo
  markUndoableState: function() {},
  undo: function() {},
  redo: function() {},

  // Highlight on screen
  highlightNode: function(config, nodeId) {
    if (nodeId === 'react_root_element') {
      return;
    }

    if (nodeId) {
      ReactInspectorAgent.call('DOM.highlightNode', nodeId, config, function() { });
    }
  },

  hideHighlight: function() {
    ReactInspectorAgent.call('DOM.hideHighlight', function() { });
  },

  // Editing
  setNodeName: function(id, name, callback) { callback('Not implemented'); },
  setNodeValue: function(id, value, callback) {
    ReactInspectorAgent.call('DOM.setNodeValue', id, value,
      function(result, error) {
        callback(error);
      }
    );
  },
  setAttributesAsText: function(id, text, name, callback) {
    ReactInspectorAgent.call('DOM.setAttributesAsText', id, text, name,
      function(result, error) {
        callback(error);
      }
    );
  },
  setAttributeValue: function(id, name, value, callback) { /* not used */ },
  removeAttribute: function(id, name, callback) { /* not used */ },
  getOuterHTML: function(id, callback) { /* disabled */ },
  setOuterHTML: function(id, html, callback) { /* disabled */  },
  removeNode: function(id, callback) {
    callback('Not implemented');
  },
  moveTo: function(id, targetNodeId, anchorNodeId, callback) {
    callback('Not implemented');
  },

  _pollForChanges: function() {
    ReactInspectorAgent.call('DOM.getChanges', function(result, error) {
      if (error) {
        DOMAgent._polling = false;
        return; // Stop polling
      }
      if (result) {
        for (var i = 0; i < result.length; i++) {
          var change = result[i];
          InspectorBackend.notifyDOM(change.method, change.args);
        }
      }
      setTimeout(DOMAgent._pollForChanges, 300);
    });
  },

  initialize: function() {
    if (DOMAgent._polling) return;
    if (!InspectorBackend._domDispatcher) return; // Don't start polling yet
    DOMAgent._polling = true;
    setTimeout(DOMAgent._pollForChanges, 300);
  }

};
