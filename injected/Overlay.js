/**
 * This module gets executed on the host page and exposes a serialized pseudo
 * DOM from the React component tree.
 */
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

(function(ReactHost) {

var inspectorIframe;
var inspectorOverlayPage;
var inspectorIframeVisible = false;

function addInspectorOverlayPage() {
  var el = document.createElement('iframe');
  el.style.position = 'fixed';
  el.style.left = '0';
  el.style.top = '0';
  el.style.height = '100%';
  el.style.width = '100%';
  el.style.border = '0';
  el.style.zIndex = 2147483647;
  el.style.pointerEvents = 'none';

  document.body.appendChild(el);

  el.contentDocument.open();
  el.contentDocument.write(
    window.__InspectorOverlayPage_html
  );
  el.contentWindow.onload = function() {
    var platform = "mac";
    var appVersion = navigator.appVersion;
    if (appVersion.indexOf('Win') > -1) {
      platform = "windows";
    } else if (appVersion.indexOf('Linux') > -1) {
      platform = "linux"
    }
    el.contentWindow.setPlatform(platform); // TODO: add support for other browsers
  };
  el.contentDocument.close();

  inspectorOverlayPage = el.contentWindow;
  inspectorIframe = el;
}

function createQuad(x, y, width, height) {
  return [
    {x: x, y: y},
    {x: x + width, y: y},
    {x: x + width, y: y + height},
    {x: x, y: y + height}
  ];
}

function getElementDimensions(element) {
  var calculatedStyle = window.getComputedStyle(element);

  return {
    borderLeft: +calculatedStyle.borderLeftWidth.match(/[0-9]*/)[0],
    borderRight: +calculatedStyle.borderRightWidth.match(/[0-9]*/)[0],
    borderTop: +calculatedStyle.borderTopWidth.match(/[0-9]*/)[0],
    borderBottom: +calculatedStyle.borderBottomWidth.match(/[0-9]*/)[0],
    marginLeft: +calculatedStyle.marginLeft.match(/[0-9]*/)[0],
    marginRight: +calculatedStyle.marginRight.match(/[0-9]*/)[0],
    marginTop: +calculatedStyle.marginTop.match(/[0-9]*/)[0],
    marginBottom: +calculatedStyle.marginBottom.match(/[0-9]*/)[0],
    paddingLeft: +calculatedStyle.paddingLeft.match(/[0-9]*/)[0],
    paddingRight: +calculatedStyle.paddingRight.match(/[0-9]*/)[0],
    paddingTop: +calculatedStyle.paddingTop.match(/[0-9]*/)[0],
    paddingBottom: +calculatedStyle.paddingBottom.match(/[0-9]*/)[0]
  };
}

function getQuads(element, bounds) {
  var scrollX = window.scrollX;
  var scrollY = window.scrollY;
  var dimensions = getElementDimensions(element);

  var contentQuad = createQuad(
    scrollX + bounds.left + dimensions.borderLeft + dimensions.paddingLeft,
    scrollY + bounds.top + dimensions.borderTop + dimensions.paddingTop,
    bounds.width - dimensions.borderLeft - dimensions.paddingLeft -
      dimensions.borderRight - dimensions.paddingRight,
    bounds.height - dimensions.borderTop - dimensions.paddingTop -
      dimensions.borderBottom - dimensions.paddingBottom
  );

  var paddingQuad = createQuad(
    scrollX + bounds.left + dimensions.borderLeft,
    scrollY + bounds.top + dimensions.borderTop,
    bounds.width - dimensions.borderLeft - dimensions.borderRight,
    bounds.height - dimensions.borderTop - dimensions.borderBottom
  );

  var borderQuad = createQuad(
    scrollX + bounds.left,
    scrollY + bounds.top,
    bounds.width,
    bounds.height
  );

  var marginQuad = createQuad(
    scrollX + bounds.left - dimensions.marginLeft,
    scrollY + bounds.top - dimensions.marginTop,
    bounds.width + dimensions.marginLeft + dimensions.marginRight,
    bounds.height + dimensions.marginTop + dimensions.marginBottom
  );

  return [
    marginQuad,
    borderQuad,
    paddingQuad,
    contentQuad
  ];
}

function getElementInfo(name, element, bounds) {
  return {
    tagName: name || '',
    idValue: element.id,
    className: element.className.trim().length ?
      (' ' + element.className.trim()).replace(/\s{1,}/g, '.') : '',
    nodeWidth: Math.round(bounds.width),
    nodeHeight: Math.round(bounds.height)
  };
}

function getHighlightColor(color) {
  return 'rgba(' + color.r + ', ' + color.g + ', ' + color.b + ', ' +
    (color.a || 1) + ')';
}

var Overlay = {

  highlightComponentInstance: function(instance, name, config) {
    if (!inspectorOverlayPage) {
      addInspectorOverlayPage();
    }

    if (!inspectorIframeVisible) {
      inspectorIframe.style.display = '';
      inspectorIframeVisible = true;
    }

    var element;
    try {
      // ART will throw on this lookup. TODO: Calculate ART rectangle.
      if (ReactHost.getNodeFromInstance) {
        // React 0.13
        element = ReactHost.getNodeFromInstance(instance);
      } else {
        element = instance.getDOMNode();
      }
    } catch (x) {
      element = null;
    }
    if (element == null) {
      DOMHost.hideHighlight();
      return;
    }

    var bounds = element.getBoundingClientRect();
    var quads = getQuads(element, bounds);

    inspectorOverlayPage.reset({
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      deviceScaleFactor: 1,
      pageScaleFactor: 1,
      pageZoomFactor: 1,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    });

    var elementInfo = null;
    if (config.showInfo) {
      elementInfo = getElementInfo(name, element, bounds);
    }

    // highlight the element
    inspectorOverlayPage.drawNodeHighlight({
      elementInfo: elementInfo,
      marginColor: getHighlightColor(config.marginColor),
      contentColor: getHighlightColor(config.contentColor),
      borderColor: getHighlightColor(config.borderColor),
      paddingColor: getHighlightColor(config.paddingColor),
      quads: quads,
      showRulers: config.showRulers
    });
  },

  hideHighlight: function() {
    inspectorIframe.style.display = 'none';
    inspectorIframeVisible = false;
  }

};

if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
    __REACT_DEVTOOLS_GLOBAL_HOOK__.Overlay) {
  return __REACT_DEVTOOLS_GLOBAL_HOOK__.Overlay;
}

return Overlay;

})
