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

// Prevent initialization

window.removeEventListener("DOMContentLoaded", windowLoaded, false);

// Hook up click handler

document.addEventListener("click", function(event) {
    var anchor = event.target.enclosingNodeOrSelfWithNodeName("a");
    if (!anchor || (anchor.target === "_blank"))
        return;

    // Prevent the link from navigating, since we don't do any navigation by following links normally.
    event.consume(true);

    function followLink() {
        if (WebInspector.isBeingEdited(event.target)) {
            return;
        }

        // Dispatch through main app
        chrome.devtools.panels.openResource(anchor.href, anchor.lineNumber);
    }

    if (WebInspector.followLinkTimeout)
        clearTimeout(WebInspector.followLinkTimeout);

    if (anchor.preventFollowOnDoubleClick) {
        // Start a timeout if this is the first click, if the timeout is canceled
        // before it fires, then a double clicked happened or another link was clicked.
        if (event.detail === 1)
            WebInspector.followLinkTimeout = setTimeout(followLink, 333);
        return;
    }

    followLink();
}, false);

// Monkey patch some url resolution

WebInspector.Linkifier.prototype.linkifyLocation =
  function(sourceURL, lineNumber, columnNumber, classes) {
    return WebInspector.linkifyResourceAsNode(sourceURL, lineNumber, classes);
  };

WebInspector.Linkifier.prototype.linkifyRawLocation =
  function(rawLocation, classes) {
    return WebInspector.linkifyURLAsNode("", "", classes, false);
    return anchor;
  };

WebInspector.resourceForURL = function() {
  return null;
};

WebInspector.workspace = {
  uiSourceCodeForURL: function() { return null; }
};

function importScript(name) {
  // Noop, we can't do synchronous fetching + eval in a chrome extension.
  // Assume all scripts are already on the page. To figure out which ones you
  // might be missing, console.log(name);
  return;
}

loadScript = importScript;

debugCSS = true; // Make url() expressions resolves to the relative path

WebInspector.View.prototype._registerRequiredCSS =
  WebInspector.View.prototype.registerRequiredCSS;
WebInspector.View.prototype.registerRequiredCSS = function(cssFile) {
  this._registerRequiredCSS('../blink/Source/devtools/front_end/' + cssFile);
};

WebInspector.debuggerModel = {
  selectedCallFrame: function() {}
};

// Monkey patch DOM node constructor to allow custom extensions to the payload

WebInspector._DOMNode = WebInspector.DOMNode;
WebInspector.DOMNode = function(domAgent, doc, isInShadowTree, payload) {
  WebInspector._DOMNode.apply(this, arguments);
  if (payload.ownerId) {
    this.ownerNode = domAgent._idToDOMNode[payload.ownerId];
  }
  this.isStateful = !!payload.stateful;
};

WebInspector.DOMNode.prototype = WebInspector._DOMNode.prototype;
WebInspector.DOMNode.prototype.constructor = WebInspector.DOMNode;

for (var key in WebInspector._DOMNode) {
  if (WebInspector._DOMNode.hasOwnProperty(key)) {
    WebInspector.DOMNode[key] = WebInspector._DOMNode[key];
  }
}

WebInspector.DOMNode.prototype.nodeNameInCorrectCase = 
  WebInspector.DOMNode.prototype.nodeName;
