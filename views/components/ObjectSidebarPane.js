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

ReactPanel.ObjectSidebarPane = function(name, emptyPlaceholder, editCallback) {
  this._emptyPlaceholder = emptyPlaceholder;
  this._editCallback = editCallback;
  WebInspector.SidebarPane.call(this, name);
};

ReactPanel.ObjectSidebarPane.prototype = {

  update: function(object) {
    var body = this.bodyElement;
    body.removeChildren();

    if (!object) {
      return;
    }

    var section = new WebInspector.ObjectPropertiesSection(object, '', '', this._emptyPlaceholder, false, null, ReactPanel.EditableObjectPropertyTreeElement.bind(null, this.onedit.bind(this)));
    section.expanded = true;
    section.editable = true;
    section.headerElement.addStyleClass("hidden");
    body.appendChild(section.element);
  },

  onedit: function() {
    if (this._editCallback) this._editCallback();
  },

  __proto__: WebInspector.SidebarPane.prototype

};

ReactPanel.EditableObjectPropertyTreeElement = function(editCallback, property) {
  this._editCallback = editCallback;
  WebInspector.ObjectPropertyTreeElement.call(this, property);
};

ReactPanel.EditableObjectPropertyTreeElement.prototype = {

  applyExpression: function(expression, updateInterface) {
    expression = expression.trim();
    var expressionLength = expression.length;
    function callback(error)
    {
        if (!updateInterface)
            return;

        if (error)
            this.update();

        if (!expressionLength) {
            // The property was deleted, so remove this tree element.
            this.parent.removeChild(this);
        } else {
            // Call updateSiblings since their value might be based on the value that just changed.
            this.updateSiblings();
        }

        this._editCallback();
    };
    this.property.parentObject.setPropertyValue(this.property.name, expression.trim(), callback.bind(this));
  },

  __proto__: WebInspector.ObjectPropertyTreeElement.prototype

};
