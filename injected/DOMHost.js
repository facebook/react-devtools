/**
 * This module gets executed on the host page and exposes a serialized pseudo
 * DOM from the React component tree.
 */
/**
 * Copyright (c) 2013-2015, Facebook, Inc. All rights reserved.
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

(function(ReactHost, OverlayPage, InjectedScript) {

var DOCUMENT_NODE = 9;
var ELEMENT_NODE = 1;
var TEXT_NODE = 3;

var instanceIDCounter = 0;
// This is assumed to be a native WeakMap or equivalent that works on frozen
// objects as keys.
var instanceIDMap = new WeakMap();

var instanceCache = {};
var descriptorCache = {};
var rootCache = {};

var updatedInstances = {};
var newRoots = {};
var deletedRoots = {};
var inspectedNodeOrInstance = null;
var lastBreakpointInstance = null;

// base URL

function getBaseURL() {
  if (typeof window === 'undefined' || !window.location) {
    return 'react://';
  }
  return window.location.toString();
}

// Pseudo DOM Description

var foundInstance = null; // Used to extract a deep search for an instance

function bindNode(instance) {
  if (!instanceIDMap.has(instance)) {
    var id = (instanceIDCounter++) + '';
    instanceIDMap.set(instance, id);
    instanceCache[id] = instance;
  }
  return instanceIDMap.get(instance);
}

function isBound(instance) {
  return instanceIDMap.has(instance);
}

function getID(instance) {
  if (!instanceIDMap.has(instance)) {
    throw new Error('This instance should already be bound.')
  }
  return instanceIDMap.get(instance);
}

function unbindNode(instance) {
  var id = instanceIDMap.get(instance);
  if (id) {
    delete instanceCache[id];
    delete instanceCache[id + '_text']; // incase this had text content
    delete descriptorCache[id];
    delete updatedInstances[id];
    if (id in newRoots) {
      delete newRoots[id];
    } else if (id in rootCache) {
      deletedRoots[id] = 1;
      delete rootCache[id];
    }
    instanceIDMap.delete(instance);
  }
}

function getAttributes(instance) {
  var attrs = [];
  var props = instance.props ||
              (instance._currentElement && instance._currentElement.props);
  if (!props) return attrs;
  for (var prop in props) {
    if (!props.hasOwnProperty(prop) ||
         prop === 'key' ||
         prop === 'children' ||
         prop === '__owner__' ||
         prop === '{owner}' ||
         prop.substr(0,2) == '__') {
      continue;
    }
    var value = props[prop];
    if (typeof value === 'function' || typeof value === 'undefined') {
      // Skip event listeners and undefined
      continue;
    }
    if (value === null) {
      value = 'null';
    }
    attrs.push(prop, typeof value === 'object' ? '\u2026' : String(value));
  }
  return attrs;
}

function getTextNode(text, id) {
  var descriptor = {
    nodeId: id,
    nodeType: TEXT_NODE,
    nodeValue: String(text),
    childNodeCount: 0
  };
  descriptorCache[id] = descriptor;
  return descriptor;
}

function isWrappedNativeComponent(instance) {
  return instance._renderedComponent.hasOwnProperty('_renderedChildren') &&
        instance._currentElement &&
        typeof instance._currentElement.type === 'string';
}

function getChildren(instance, depth, diveTo) {
  var children = null;
  if (ReactHost.hasTextContent(instance)) {
    var textId = bindNode(instance) + '_text';
    instanceCache[textId] = instance;
    var content = ReactHost.getTextContent(instance);
    children = [getTextNode(content, textId)];
  } else if (instance._renderedComponent) {
    if (isWrappedNativeComponent(instance)) {
      // This is a workaround that by passes the internal DOM component and gets
      // to it's children directly. The internal node isn't relevant and should
      // never be exposed. Even for debugging.
      children = getChildren(instance._renderedComponent, depth, diveTo);
    } else {
      children = [getDOMNode(instance._renderedComponent, depth, diveTo)];
    }
  } else if (instance._renderedChildren) {
    children = getDOMNodes(instance._renderedChildren, depth, diveTo);
  } else {
    children = [];
  }
  return children;
}

function getChildCount(instance) {
  if (ReactHost.hasTextContent(instance)) {
    return 1;
  } else if (instance._renderedComponent) {
    if (isWrappedNativeComponent(instance)) {
      // This is a workaround that by passes the internal DOM component and gets
      // to it's children directly. The internal node isn't relevant and should
      // never be exposed. Even for debugging.
      return getChildCount(instance._renderedComponent);
    } else {
      return 1;
    }
  } else if (instance._renderedChildren) {
    var count = 0;
    for (var key in instance._renderedChildren) {
      if (instance._renderedChildren[key]) {
        count++;
      }
    }
    return count;
  } else {
    return 0;
  }
}

function getDOMNode(instance, depth, diveTo) {
  if (diveTo) {
    if (ReactHost.isInstance(instance, diveTo)) {
      foundInstance = instance;
      depth = 0;
    } else if (!ReactHost.isAncestorOf(instance, diveTo)) {
      depth = 0;
    }
  }

  // TODO: Better duck checking, of what is a text component
  if (ReactHost.isTextComponent(instance)) {
    if (typeof instance._stringText === 'string') {
      // React 0.13
      return getTextNode(instance._stringText, bindNode(instance));
    } else if (typeof instance.props === "string") {
      // React 0.11 - 0.12
      return getTextNode(instance.props, bindNode(instance));
    } else {
      // React 0.10
      return getTextNode(instance.props.text, bindNode(instance));
    }
  }

  var id = bindNode(instance);
  var publicInstance = instance.getPublicInstance ? instance.getPublicInstance()
                       : instance;
  var tagName = publicInstance.tagName && publicInstance.tagName.toLowerCase();
  // For several reasons, there's only one React class in Om. So we
  // check for getDisplayName on the instance itself (if available).
  var instanceName = publicInstance.getDisplayName &&
                     publicInstance.getDisplayName();
  var name = instanceName || tagName || publicInstance.constructor.displayName
             || publicInstance.constructor.name
             || 'Unknown';
  var children = null;

  if (depth != 0 || ReactHost.hasTextContent(instance)) {
    // For simple string children, we include them immediately
    children = getChildren(instance, depth - 1, diveTo);
  }

  // TODO: Owner is going away. Not sure what to do about this.
  // Perhaps add a DEV-only version.
  var owner = instance._owner ||
              (instance._currentElement && instance._currentElement._owner) ||
              (instance.props && instance.props.__owner__);
  var ownerId = null;
  if (owner) {
    ownerId = bindNode(owner);
  }

  var descriptor = {
    nodeId: id,
    ownerId: ownerId,
    nodeType: ELEMENT_NODE,
    nodeName: name,
    localName: name,
    attributes: getAttributes(instance),
    stateful: !!instance.state,
    childNodeCount: children == null ? getChildCount(instance) : children.length,
    children: children
  };
  if (!(id in descriptorCache)) {
    descriptorCache[id] = descriptor;
  }
  return descriptor;
}

function getDOMNodes(instances, depth, diveTo) {
  var childInstances = [];
  for (var key in instances) {
    var instance = instances[key];
    if (!instance) {
      continue;
    }
    childInstances.push(instance);
  }
  childInstances.sort(function(a, b) { return a._mountIndex - b._mountIndex; });
  var childNodes = childInstances.map(function(instance) {
    return getDOMNode(instance, depth, diveTo);
  });
  return childNodes;
}

var DOMHost = {};

DOMHost.getDocument = function() {
  var rootNodes = getDOMNodes(ReactHost.instancesByRootID, 0);
  for (var i = 0; i < rootNodes.length; i++) {
    var childDescriptor = rootNodes[i];
    rootCache[childDescriptor.nodeId] = childDescriptor;
  }

  var root = {
    nodeId: 'react_root_element',
    nodeType: ELEMENT_NODE,
    nodeName: 'Top Level',
    localName: 'Top Level',
    attributes: [],
    childNodeCount: rootNodes.length,
    children: rootNodes
  };

  return {
    baseURL: getBaseURL(),
    nodeId: 'react_root_document',
    nodeType: DOCUMENT_NODE,
    nodeName: 'document',
    localName: 'document',
    attributes: [],
    childNodeCount: 1,
    children: [root]
  };
};

DOMHost.getChildNodes = function(parentId, depth) {
  var instance = instanceCache[parentId];
  var children = getChildren(instance, depth || 0);
  // Update the cache, TODO: recursively
  descriptorCache[parentId].children = children;
  return children;
};

DOMHost.getNodeForPath = function(path) {
  // https://github.com/mirrors/blink/blob/b9bce8c/Source/core/inspector/InspectorDOMAgent.cpp#L1942-L1971
  var changeLog = [];
  var ancestorWithMissingChildren = null;
  var node = DOMHost.getDocument();
  var pathTokens = path.split(',');
  if (!pathTokens) {
    return {changeLog: changeLog, node: null};
  }
  for (var i = 0; i < pathTokens.length; i += 2) {
    var childNumber = +pathTokens[i];
    var childName = pathTokens[i + 1];
    if (isNaN(childNumber) || childNumber >= node.children.length) {
      return {changeLog: changeLog, node: null};
    }
    child = node.children[childNumber];
    if (!child || child.nodeName != childName) {
      return {changeLog: changeLog, node: null};
    }
    node = child;
    if (!node.children) {
      node.children = getChildren(instanceCache[node.nodeId], 0);
      if (!ancestorWithMissingChildren) {
        ancestorWithMissingChildren = node;
        changeLog.push({
          method: 'setChildNodes',
          args: [node.nodeId, node.children]
        });
      }
    }
  }
  return {changeLog: changeLog, node: node};
};

DOMHost.resolveNode = function(id, objectGroup) {
  var instance = instanceCache[id];
  if (!instance) return null;
  var publicInstance = instance.getPublicInstance ? instance.getPublicInstance()
                       : instance;
  var descriptor = InjectedScript.wrapObject(
    publicInstance, objectGroup, true, true
  );
  return descriptor;
};

var getSelectedInstance;
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
    typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.getSelectedInstance === 'function') {
  getSelectedInstance = __REACT_DEVTOOLS_GLOBAL_HOOK__.getSelectedInstance;
} else {
  getSelectedInstance = function() {
    return $0;
  };
}

DOMHost.inspectSelectedNode = function() {
  inspectedNodeOrInstance = getSelectedInstance();
};

DOMHost.highlightNode = function(id, config) {
  var descriptor = descriptorCache[id];
  var instance = instanceCache[id];
  var publicInstance = instance.getPublicInstance ?
                       instance.getPublicInstance() :
                       instance;
  OverlayPage.highlightComponentInstance(
    publicInstance,
    (descriptor && descriptor.nodeName) || '',
    config
  );
};

DOMHost.hideHighlight = function() {
  OverlayPage.hideHighlight();
};

DOMHost.getEventListenersForNode = function(id, objectGroup) {
  var instance = instanceCache[id];
  if (!instance) return [];
  var listeners = ReactHost.getEventListeners(instance);
  return listeners.map(function(listener) {
    var descriptor = InjectedScript.wrapObject(
      listener.handler, objectGroup, true, true
    );
    var sourceName = null;
    if (listener.owner) {
      var publicInstance = listener.owner.getPublicInstance ?
                           listener.owner.getPublicInstance() :
                           listener.owner;
      sourceName = publicInstance.constructor.displayName ||
                   publicInstance.constructor.name || 'Unknown';
      if (listener.methodName) {
        sourceName += '::' + listener.methodName;
      }
    }
    return {
      nodeId: id,
      type: listener.name,
      handlerBody: '' + listener.handler,
      handler: descriptor,
      sourceName: sourceName
      /*
      TODO: Get sourceName to be the file name and lineNumber to be the line
      where this function is defined.
      location: {
        lineNumber: 10
      },
      useCapture: true,
      isAttribute: true,
      */
    };
  });
};

function parseValue(stringValue, currentType) {
  switch (currentType) {
    case 'boolean':
      if (stringValue === 'true'){
        return true;
      } else if (stringValue === 'false') {
        return false;
      }
      throw new Error('Unsupported value');
    case 'number':
      return Number(stringValue);
    case 'string':
      return String(stringValue);
    default:
      throw new Error('Unsupported type');
  }
}

DOMHost.setNodeValue = function(id, value) {
  var instance = instanceCache[id];
  var currentValue;
  if (ReactHost.isTextComponent(instance)) {
    if (typeof instance._stringText === "string") {
      // React 0.13
      instance.receiveComponent(
        parseValue(value, typeof instance._currentElement)
      );
      Subscriber.componentWillUpdate(instance);
      return;
    } else if (typeof instance.props === "string") {
      // React 0.11 - 0.12
      instance.props = parseValue(value, typeof instance.props);
    } else if (ReactHost.isTextComponent(instance)) {
      // React 0.10+
      instance.props.text = parseValue(value, typeof instance.props.text);
    }
  } else {
    instance.props.children = parseValue(value, typeof instance.props.children);
  }
  if (instance.forceUpdate) {
    instance.forceUpdate();
  } else if (instance.getPublicInstance &&
             instance.getPublicInstance().forceUpdate) {
    instance.getPublicInstance().forceUpdate();
  }
};

DOMHost.setAttributesAsText = function(id, text, name) {
  var instance = instanceCache[id];
  var props = instance.props ||
              (instance._currentElement && instance._currentElement.props);
  if (!props) {
    return;
  }
  var currentValue = props[name];
  if (text == '') {
    delete props[name];
  } else {
    var match = (/\s*([^=\s]+)\s*=\s*\"(.*)\"\s*/).exec(text);
    if (!match) throw new Error('Unsupported string');
    var newName = match[1];
    var newValue = parseValue(match[2], typeof currentValue);
    if (name !== newName) {
      delete props[name];
    }
    props[newName] = newValue;
  }
  if (instance.forceUpdate) {
    instance.forceUpdate();
  } else if (instance.getPublicInstance &&
             instance.getPublicInstance().forceUpdate) {
    instance.getPublicInstance().forceUpdate();
  }
};

// Change tracking

function appendAttributeChanges(id, descriptor, instance, changeLog) {
  var oldAttributes = {};
  if (descriptor.attributes) {
    for (var i = 0; i < descriptor.attributes.length; i+=2) {
      oldAttributes[descriptor.attributes[i]] = descriptor.attributes[i + 1];
    }
  }
  var newAttributes = getAttributes(instance);
  for (var i = 0; i < newAttributes.length; i+=2) {
    var name = newAttributes[i];
    var value = newAttributes[i + 1];
    if (oldAttributes[name] !== value) {
      changeLog.push({
        method: 'attributeModified',
        args: [id, name, value]
      });
    }
    delete oldAttributes[name];
  }
  for (var removedName in oldAttributes) {
    changeLog.push({
      method: 'attributeRemoved',
      args: [id, removedName]
    });
  }
  // Update cache
  descriptor.attributes = newAttributes;
}

function appendChildChanges(id, descriptor, instance, changeLog) {
  if (descriptor.nodeType === TEXT_NODE) {
    var newDescriptor = getDOMNode(instance);
    changeLog.push({
      method: 'characterDataModified',
      args: [id, newDescriptor.nodeValue]
    });
    return;
  }

  if (!descriptor.children) {
    // We never sent the children, so we don't need to update them, the count
    // is enough.
    var newCount = getChildCount(instance);
    if (descriptor.childNodeCount !== newCount) {
      changeLog.push({
        method: 'childNodeCountUpdated',
        args: [id, newCount]
      });
      // Update cache
      descriptor.childNodeCount = newCount;
    }
    return;
  }

  var oldChildren = {};
  for (var i = 0; i < descriptor.children.length; i++) {
    var prevChild = descriptor.children[i];
    oldChildren[prevChild.nodeId] = prevChild;
    prevChild._index = i;
  }

  var newChildren = getChildren(instance, 0);

  // `nextIndex` will increment for each child in `nextChildren`, but
  // `lastIndex` will be the last index visited in `prevChildren`.
  var lastIndex = 0;
  var nextIndex = 0;
  var previousId = null;
  for (var i = 0; i < newChildren.length; i++) {
    var nextChild = newChildren[i];
    var prevChild = oldChildren[nextChild.nodeId];
    if (prevChild) {
      delete oldChildren[nextChild.nodeId];

      if (prevChild._index < lastIndex) {
        // Moved
        changeLog.push({
          method: 'childNodeRemoved',
          args: [id, nextChild.nodeId]
        }, {
          method: 'childNodeInserted',
          args: [id, previousId, nextChild]
        });
      }
      lastIndex = Math.max(prevChild._index, lastIndex);

      // We update text nodes from the parent instead of having the component
      // update itself. Why? I forget.
      if (nextChild.nodeType === TEXT_NODE &&
          nextChild.nodeValue !== prevChild.nodeValue) {
        changeLog.push({
          method: 'characterDataModified',
          args: [nextChild.nodeId, nextChild.nodeValue]
        });
      }
    } else {
      // Inserted
      changeLog.push({
        method: 'childNodeInserted',
        args: [id, previousId, nextChild]
      });
    }
    previousId = nextChild.nodeId;
    nextIndex++;
  }

  for (var removedId in oldChildren) {
    // The rest is deleted
    changeLog.push({
      method: 'childNodeRemoved',
      args: [id, removedId]
    });
  }

  descriptor.children = newChildren;
}

function findAncestorWithMissingChildren(instance, decendant) {
  if (ReactHost.isInstance(instance, decendant)) {
    foundInstance = instance;
    return null;
  }

  var descriptor = descriptorCache[getID(instance)];
  if (!descriptor.children) {
    return instance;
  }
  if (ReactHost.hasTextContent(instance)) {
    return null;
  } else if (instance._renderedComponent) {
    return findAncestorWithMissingChildren(instance._renderedComponent, decendant);
  } else if (instance._renderedChildren) {
    return findAncestorWithMissingChildrenInSet(instance._renderedChildren, decendant);
  }
  return null;
}

function findAncestorWithMissingChildrenInSet(children, decendant) {
  for (var key in children) {
    var child = children[key];
    if (!child) continue;
    if (ReactHost.isAncestorOf(child, decendant)) {
      return findAncestorWithMissingChildren(child, decendant);
    }
  }
  return null;
}

function appendInspectionEvents(domNodeOrInstance, changeLog) {
  // TODO: Convert a public instance to an internal one
  foundInstance = null;
  var ancestor = findAncestorWithMissingChildrenInSet(
    ReactHost.instancesByRootID,
    domNodeOrInstance
  );
  if (!ancestor) {
    var instance = foundInstance;
    foundInstance = null;
    if (!instance) {
      return;
    }
    changeLog.push({
      method: 'inspectNodeRequested',
      args: [bindNode(instance)]
    });
    return;
  }
  var children = getChildren(ancestor, -1, domNodeOrInstance);
  var instance = foundInstance;
  foundInstance = null;
  descriptorCache[getID(ancestor)].children = children;
  changeLog.push({
    method: 'setChildNodes',
    args: [getID(ancestor), children]
  }, {
    method: 'inspectNodeRequested',
    args: [bindNode(instance)]
  });
}

DOMHost.reset = function() {
  // Reset the state
  for (var id in instanceCache) {
    if (instanceCache.hasOwnProperty(id)) {
      unbindNode(instanceCache[id]);
    }
  }

  updatedInstances = {};
  newRoots = {};
  deletedRoots = {};
  inspectedNodeOrInstance = null;
  lastBreakpointInstance = null;
};

DOMHost.getChanges = function() {
  var changeLog = [];
  var descriptor;

  // New roots

  var previousRootId = null;
  for (previousRootId in rootCache);

  for (var id in newRoots) {
    descriptor = getDOMNode(newRoots[id], 0);
    rootCache[descriptor.nodeId] = descriptor;
    changeLog.push({
      method: 'childNodeInserted',
      args: [
        'react_root_element',
        previousRootId,
        descriptor
      ]
    });
    previousRootId = descriptor.nodeId;
  }

  // Updates

  for (var id in updatedInstances) {
    var instance = updatedInstances[id];
    var descriptor = descriptorCache[id];
    appendAttributeChanges(id, descriptor, instance, changeLog);
    appendChildChanges(id, descriptor, instance, changeLog);
  }

  // Removed roots

  for (var id in deletedRoots) {
    delete rootCache[id];
    changeLog.push({
      method: 'childNodeRemoved',
      args: [
        'react_root_element',
        id
      ]
    });
  }

  updatedInstances = {};
  newRoots = {};
  deletedRoots = {};

  // Rendering breakpoint

  var breakpointInstance = ReactHost.getCurrentlyRenderingComponent();
  if (breakpointInstance) {
    // This instance is currently rendering. It may be updated later. Mark it
    // as updated for the next poll.
    Subscriber.componentWillUpdate(breakpointInstance);

    // If this is a new breakpoint, let's inspect that instance
    if (lastBreakpointInstance !== breakpointInstance) {
      appendInspectionEvents(breakpointInstance, changeLog);
      inspectedNodeOrInstance = null;
    }
  }
  lastBreakpointInstance = breakpointInstance;

  // Inspected node

  if (inspectedNodeOrInstance) {
    appendInspectionEvents(inspectedNodeOrInstance, changeLog);
    inspectedNodeOrInstance = null;
  }

  return changeLog;
};

var Subscriber = {

  componentWillMount: function(instance) {
    if (ReactHost.instancesByRootID[instance._rootNodeID] === instance) {
      // This is a new root
      newRoots[bindNode(instance)] = instance;
    }
    Subscriber.componentWillUpdate(instance);
  },

  componentWillUpdate: function(instance) {
    if (isBound(instance) && !(getID(instance) in newRoots)) {
      updatedInstances[getID(instance)] = instance;
    }
  },

  componentWillUnmount: function(instance) {
    unbindNode(instance);
  }

};

ReactHost.subscribeToChanges(Subscriber);

return DOMHost;

})
