/*
 * Copyright (C) 2007, 2008 Apple Inc.  All rights reserved.
 * Copyright (C) 2008 Matt Lilek <webkit@mattlilek.com>
 * Copyright (C) 2009 Joseph Pecoraro
 * Copyright (C) 2013-2014, Facebook, Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Computer, Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

importScript("CSSNamedFlowCollectionsView.js");
importScript("CSSNamedFlowView.js");
importScript("EventListenersSidebarPane.js");
importScript("ObjectSidebarPane.js");

var ReactPanel = function()
{
    WebInspector.View.call(this);

    this.element.addStyleClass("panel");
    this.element.addStyleClass("elements");

    this.registerRequiredCSS("breadcrumbList.css");
    this.registerRequiredCSS("elementsPanel.css");
    this.registerRequiredCSS("textPrompt.css");
    this.setHideOnDetach();

    const initialSidebarWidth = 325;
    const minimumContentWidthPercent = 0.34;
    const initialSidebarHeight = 325;
    const minimumContentHeightPercent = 0.34;
    this.createSidebarView(this.element, WebInspector.SidebarView.SidebarPosition.End, initialSidebarWidth, initialSidebarHeight);
    this.splitView.setSidebarElementConstraints(Preferences.minElementsSidebarWidth, Preferences.minElementsSidebarHeight);
    this.splitView.setMainElementConstraints(minimumContentWidthPercent, minimumContentHeightPercent);
    this.splitView.addEventListener(WebInspector.SidebarView.EventTypes.Resized, this._updateTreeOutlineVisibleWidth.bind(this));

    this._searchableView = new WebInspector.SearchableView(this);
    this.splitView.mainElement.addStyleClass("vbox");
    this._searchableView.show(this.splitView.mainElement);
    var stackElement = this._searchableView.element;

    this.contentElement = stackElement.createChild("div");
    this.contentElement.id = "elements-content";
    this.contentElement.addStyleClass("outline-disclosure");
    this.contentElement.addStyleClass("source-code");
    if (!WebInspector.settings.domWordWrap.get())
        this.contentElement.classList.add("nowrap");
    WebInspector.settings.domWordWrap.addChangeListener(this._domWordWrapSettingChanged.bind(this));

    this.contentElement.addEventListener("contextmenu", this._contextMenuEventFired.bind(this), true);
    this.splitView.sidebarElement.addEventListener("contextmenu", this._sidebarContextMenuEventFired.bind(this), false);

    this.treeOutline = new WebInspector.ElementsTreeOutline(true, true, this._populateContextMenu.bind(this), this._setPseudoClassForNodeId.bind(this));
    this.treeOutline.wireToDomAgent();
    this.treeOutline.addEventListener(WebInspector.ElementsTreeOutline.Events.SelectedNodeChanged, this._selectedNodeChanged, this);
    this.treeOutline.addEventListener(WebInspector.ElementsTreeOutline.Events.ElementsTreeUpdated, this._updateBreadcrumbIfNeeded, this);

    this.element.addEventListener('keydown', this._treeKeyDown.bind(this), false);

    var crumbsContainer = stackElement.createChild("div");
    crumbsContainer.id = "elements-crumbs";
    this.crumbsElement = crumbsContainer.createChild("div", "crumbs");
    this.crumbsElement.addEventListener("mousemove", this._mouseMovedInCrumbs.bind(this), false);
    this.crumbsElement.addEventListener("mouseout", this._mouseMovedOutOfCrumbs.bind(this), false);

    this.sidebarPanes = {};
    this.sidebarPanes.props = new ReactPanel.ObjectSidebarPane(WebInspector.UIString("Props"), WebInspector.UIString("No Props"), this.forceUpdate.bind(this));
    this.sidebarPanes.state = new ReactPanel.ObjectSidebarPane(WebInspector.UIString("State"), WebInspector.UIString("No State"), this.forceUpdate.bind(this));
    this.sidebarPanes.instance = new ReactPanel.ObjectSidebarPane(WebInspector.UIString("Component"), null, this.forceUpdate.bind(this));;
    this.sidebarPanes.eventListeners = new WebInspector.EventListenersSidebarPane();

    this.sidebarPanes.props.addEventListener(WebInspector.SidebarPane.EventTypes.wasShown, this.updateInstance.bind(this));
    this.sidebarPanes.state.addEventListener(WebInspector.SidebarPane.EventTypes.wasShown, this.updateInstance.bind(this));
    this.sidebarPanes.instance.addEventListener(WebInspector.SidebarPane.EventTypes.wasShown, this.updateInstance.bind(this));
    this.sidebarPanes.eventListeners.addEventListener(WebInspector.SidebarPane.EventTypes.wasShown, this.updateEventListeners.bind(this));

    this.sidebarPanes.props.expand();
    this.sidebarPanes.state.expand();

    //WebInspector.dockController.addEventListener(WebInspector.DockController.Events.DockSideChanged, this._dockSideChanged.bind(this));
    //WebInspector.settings.splitVerticallyWhenDockedToRight.addChangeListener(this._dockSideChanged.bind(this));
    this._dockSideChanged();

    this._popoverHelper = new WebInspector.PopoverHelper(this.element, this._getPopoverAnchor.bind(this), this._showPopover.bind(this));
    this._popoverHelper.setTimeout(0);


    WebInspector.domAgent.addEventListener(WebInspector.DOMAgent.Events.DocumentUpdated, this._documentUpdatedEvent, this);

    if (WebInspector.domAgent.existingDocument())
        this._documentUpdated(WebInspector.domAgent.existingDocument());
}

ReactPanel.prototype = {

    decorateNodeLabel: function(node, parentElement)
    {
        var title = node.nodeNameInCorrectCase();
        var nameElement = document.createElement(node.isStateful ? 'strong' : 'span');
        nameElement.textContent = title;
        parentElement.appendChild(nameElement);
        parentElement.title = title;
    },

    _treeKeyDown: function(event) {
        if (event.target !== this.treeOutline.childrenListElement)
            return;

        if (!this.treeOutline.selectedTreeElement || !event.shiftKey || event.altKey || event.metaKey || event.ctrlKey)
            return;

        var nextNode;
        if (event.keyIdentifier === 'Up') {
            nextNode = this._findSiblingBreadcrumbNode(false);
        } else if (event.keyIdentifier === 'Down') {
            nextNode = this._findSiblingBreadcrumbNode(true);
        } else {
            return;
        }

        if (nextNode) {
            this.selectDOMNode(nextNode, true);
            event.consume(true);
        }
    },

    _findSiblingBreadcrumbNode: function(down) {
        var crumbs = this.crumbsElement;
        var crumb = crumbs.firstChild;
        while (crumb) {
            if (crumb.representedObject === this.selectedDOMNode()) {
                var nextCrumb = down ? crumb.nextSibling : crumb.previousSibling;
                return nextCrumb ? nextCrumb.representedObject : null;
            }
            crumb = crumb.nextSibling;
        }
        return null;
    },

    /* FROM PANEL */

    createSidebarView: function(parentElement, position, defaultWidth, defaultHeight)
    {
        if (this.splitView)
            return;

        if (!parentElement)
            parentElement = this.element;

        this.splitView = new WebInspector.SidebarView(position, this._sidebarWidthSettingName(), defaultWidth, defaultHeight);
        this.splitView.show(parentElement);
        this.splitView.addEventListener(WebInspector.SidebarView.EventTypes.Resized, this.sidebarResized.bind(this));

        this.sidebarElement = this.splitView.sidebarElement;
    },

    sidebarResized: function(event)
    {
    },

    _sidebarWidthSettingName: function()
    {
        return "ElementsSidebarWidth";
    },

    /* END FROM PANEL */

    _updateTreeOutlineVisibleWidth: function()
    {
        if (!this.treeOutline)
            return;

        var width = this.splitView.element.offsetWidth;
        if (this.splitView.isVertical())
            width -= this.splitView.sidebarWidth();
        this.treeOutline.setVisibleWidth(width);
        this.updateBreadcrumbSizes();
    },

    defaultFocusedElement: function()
    {
        return this.treeOutline.element;
    },

    statusBarResized: function()
    {
        this.updateBreadcrumbSizes();
    },

    wasShown: function()
    {
        // Attach heavy component lazily
        if (this.treeOutline.element.parentElement !== this.contentElement)
            this.contentElement.appendChild(this.treeOutline.element);

        this.updateBreadcrumb();
        this.treeOutline.updateSelection();
        this.treeOutline.setVisible(true);

        if (!this.treeOutline.rootDOMNode)
            WebInspector.domAgent.requestDocument();
    },

    willHide: function()
    {
        WebInspector.domAgent.hideDOMNodeHighlight();
        this.treeOutline.setVisible(false);
        this._popoverHelper.hidePopover();

        // Detach heavy component on hide
        this.contentElement.removeChild(this.treeOutline.element);

        WebInspector.Panel.prototype.willHide.call(this);
    },

    onResize: function()
    {
        this.treeOutline.updateSelection();
        this.updateBreadcrumbSizes();
    },

    createView: function(id)
    {
        if (!this._overridesView)
            this._overridesView = new WebInspector.OverridesView();
        return this._overridesView;
    },

    _setPseudoClassForNodeId: function(nodeId, pseudoClass, enable)
    {
        var node = WebInspector.domAgent.nodeForId(nodeId);
        if (!node)
            return;

        var pseudoClasses = node.getUserProperty(WebInspector.ElementsTreeOutline.PseudoStateDecorator.PropertyName);
        if (enable) {
            pseudoClasses = pseudoClasses || [];
            if (pseudoClasses.indexOf(pseudoClass) >= 0)
                return;
            pseudoClasses.push(pseudoClass);
            node.setUserProperty(WebInspector.ElementsTreeOutline.PseudoStateDecorator.PropertyName, pseudoClasses);
        } else {
            if (!pseudoClasses || pseudoClasses.indexOf(pseudoClass) < 0)
                return;
            pseudoClasses.remove(pseudoClass);
            if (!pseudoClasses.length)
                node.removeUserProperty(WebInspector.ElementsTreeOutline.PseudoStateDecorator.PropertyName);
        }

        this.treeOutline.updateOpenCloseTags(node);
        WebInspector.cssModel.forcePseudoState(node.id, node.getUserProperty(WebInspector.ElementsTreeOutline.PseudoStateDecorator.PropertyName));
        this._metricsPaneEdited();
        this._stylesPaneEdited();

        WebInspector.notifications.dispatchEventToListeners(WebInspector.UserMetrics.UserAction, {
            action: WebInspector.UserMetrics.UserActionNames.ForcedElementState,
            selector: node.appropriateSelectorFor(false),
            enabled: enable,
            state: pseudoClass
        });
    },

    _selectedNodeChanged: function()
    {
        var selectedNode = this.selectedDOMNode();
        if (!selectedNode && this._lastValidSelectedNode)
            this._selectedPathOnReset = this._lastValidSelectedNode.path();

        this.updateBreadcrumb(false);

        this._updateSidebars();

        if (selectedNode) {
            //ConsoleAgent.addInspectedNode(selectedNode.id);
            this._lastValidSelectedNode = selectedNode;
        }
        WebInspector.notifications.dispatchEventToListeners(WebInspector.ElementsTreeOutline.Events.SelectedNodeChanged);
    },

    _updateSidebars: function()
    {
        for (var pane in this.sidebarPanes)
           this.sidebarPanes[pane].needsUpdate = true;

        this.updateInstance();
        this.updateEventListeners();
    },

    _reset: function()
    {
        delete this.currentQuery;
    },

    _documentUpdatedEvent: function(event)
    {
        this._documentUpdated(event.data);
    },

    _documentUpdated: function(inspectedRootDocument)
    {
        this._reset();
        this.searchCanceled();

        this.treeOutline.rootDOMNode = inspectedRootDocument;

        if (!inspectedRootDocument) {
            if (this.isShowing())
                WebInspector.domAgent.requestDocument();
            return;
        }

        function selectNode(candidateFocusNode)
        {
            if (!candidateFocusNode)
                candidateFocusNode = inspectedRootDocument;

            if (!candidateFocusNode)
                return;

            this.selectDOMNode(candidateFocusNode, true);
            if (this.treeOutline.selectedTreeElement)
                this.treeOutline.selectedTreeElement.expand();
        }

        function selectLastSelectedNode(nodeId)
        {
            if (this.selectedDOMNode()) {
                // Focused node has been explicitly set while reaching out for the last selected node.
                return;
            }
            var node = nodeId ? WebInspector.domAgent.nodeForId(nodeId) : null;
            selectNode.call(this, node);
        }

        if (this._selectedPathOnReset)
            WebInspector.domAgent.pushNodeByPathToFrontend(this._selectedPathOnReset, selectLastSelectedNode.bind(this));
        else
            selectNode.call(this);
        delete this._selectedPathOnReset;
    },

    searchCanceled: function()
    {
        delete this._searchQuery;
        this._hideSearchHighlights();

        delete this._currentSearchResultIndex;
        delete this._searchResults;
        WebInspector.domAgent.cancelSearch();
    },

    performSearch: function(query, shouldJump)
    {
        // Call searchCanceled since it will reset everything we need before doing a new search.
        this.searchCanceled();

        const whitespaceTrimmedQuery = query.trim();
        if (!whitespaceTrimmedQuery.length)
            return;

        this._searchQuery = query;

        function resultCountCallback(resultCount)
        {
            if (!resultCount)
                return;

            this._searchResults = new Array(resultCount);
            this._currentSearchResultIndex = -1;
            if (shouldJump)
                this.jumpToNextSearchResult();
        }
        WebInspector.domAgent.performSearch(whitespaceTrimmedQuery, resultCountCallback.bind(this));
    },

    _contextMenuEventFired: function(event)
    {
        function toggleWordWrap()
        {
            WebInspector.settings.domWordWrap.set(!WebInspector.settings.domWordWrap.get());
        }

        var contextMenu = new WebInspector.ContextMenu(event);
        // Disabled
        contextMenu.appendCheckboxItem(WebInspector.UIString(WebInspector.useLowerCaseMenuTitles() ? "Word wrap" : "Word Wrap"), toggleWordWrap.bind(this), WebInspector.settings.domWordWrap.get());

        contextMenu.show();
    },

    _showNamedFlowCollections: function()
    {
        if (!WebInspector.cssNamedFlowCollectionsView)
            WebInspector.cssNamedFlowCollectionsView = new WebInspector.CSSNamedFlowCollectionsView();
        WebInspector.cssNamedFlowCollectionsView.showInDrawer();
    },

    _domWordWrapSettingChanged: function(event)
    {
        if (event.data)
            this.contentElement.removeStyleClass("nowrap");
        else
            this.contentElement.addStyleClass("nowrap");

        var selectedNode = this.selectedDOMNode();
        if (!selectedNode)
            return;

        var treeElement = this.treeOutline.findTreeElement(selectedNode);
        if (treeElement)
            treeElement.updateSelection(); // Recalculate selection highlight dimensions.
    },

    switchToAndFocus: function(node)
    {
        // Reset search restore.
        WebInspector.searchController.cancelSearch();
        WebInspector.inspectorView.setCurrentPanel(this);
        this.selectDOMNode(node, true);
    },

    _populateContextMenu: function(contextMenu, node)
    {
        // Add debbuging-related actions
        contextMenu.appendSeparator();
        var pane = WebInspector.domBreakpointsSidebarPane;
        pane.populateNodeContextMenu(node, contextMenu);
    },

    _getPopoverAnchor: function(element)
    {
        var anchor = element.enclosingNodeOrSelfWithClass("webkit-html-resource-link");
        if (anchor) {
            if (!anchor.href)
                return null;
            // Disabled image loading
        }
        return anchor;
    },

    _loadDimensionsForNode: function(treeElement, callback)
    {
        // We get here for CSS properties, too, so bail out early for non-DOM treeElements.
        if (treeElement.treeOutline !== this.treeOutline) {
            callback();
            return;
        }

        var node = (treeElement.representedObject);

        if (!node.nodeName() || node.nodeName().toLowerCase() !== "img") {
            callback();
            return;
        }

        WebInspector.RemoteObject.resolveNode(node, "", resolvedNode);

        function resolvedNode(object)
        {
            if (!object) {
                callback();
                return;
            }

            object.callFunctionJSON(dimensions, undefined, callback);
            object.release();

            function dimensions()
            {
                return { offsetWidth: this.offsetWidth, offsetHeight: this.offsetHeight, naturalWidth: this.naturalWidth, naturalHeight: this.naturalHeight };
            }
        }
    },

    _showPopover: function(anchor, popover)
    {
        var listItem = anchor.enclosingNodeOrSelfWithNodeName("li");
        if (listItem && listItem.treeElement)
            this._loadDimensionsForNode(listItem.treeElement, WebInspector.DOMPresentationUtils.buildImagePreviewContents.bind(WebInspector.DOMPresentationUtils, anchor.href, true, showPopover));
        else
            WebInspector.DOMPresentationUtils.buildImagePreviewContents(anchor.href, true, showPopover);

        function showPopover(contents)
        {
            if (!contents)
                return;
            popover.setCanShrink(false);
            popover.show(contents, anchor);
        }
    },

    jumpToNextSearchResult: function()
    {
        if (!this._searchResults)
            return;

        this._hideSearchHighlights();
        if (++this._currentSearchResultIndex >= this._searchResults.length)
            this._currentSearchResultIndex = 0;

        this._highlightCurrentSearchResult();
    },

    jumpToPreviousSearchResult: function()
    {
        if (!this._searchResults)
            return;

        this._hideSearchHighlights();
        if (--this._currentSearchResultIndex < 0)
            this._currentSearchResultIndex = (this._searchResults.length - 1);

        this._highlightCurrentSearchResult();
    },

    _highlightCurrentSearchResult: function()
    {
        var index = this._currentSearchResultIndex;
        var searchResults = this._searchResults;
        var searchResult = searchResults[index];

        if (searchResult === null) {
            WebInspector.searchController.updateCurrentMatchIndex(index, this);
            return;
        }

        if (typeof searchResult === "undefined") {
            // No data for slot, request it.
            function callback(node)
            {
                searchResults[index] = node || null;
                this._highlightCurrentSearchResult();
            }
            WebInspector.domAgent.searchResult(index, callback.bind(this));
            return;
        }

        WebInspector.searchController.updateCurrentMatchIndex(index, this);

        var treeElement = this.treeOutline.findTreeElement(searchResult);
        if (treeElement) {
            treeElement.highlightSearchResults(this._searchQuery);
            treeElement.reveal();
            var matches = treeElement.listItemElement.getElementsByClassName("highlighted-search-result");
            if (matches.length)
                matches[0].scrollIntoViewIfNeeded();
        }
    },

    _hideSearchHighlights: function()
    {
        if (!this._searchResults)
            return;
        var searchResult = this._searchResults[this._currentSearchResultIndex];
        if (!searchResult)
            return;
        var treeElement = this.treeOutline.findTreeElement(searchResult);
        if (treeElement)
            treeElement.hideSearchHighlights();
    },

    selectedDOMNode: function()
    {
        return this.treeOutline.selectedDOMNode();
    },

    selectDOMNode: function(node, focus)
    {
        this.treeOutline.selectDOMNode(node, focus);
    },

    _updateBreadcrumbIfNeeded: function(event)
    {
        var nodes = (event.data || []);
        if (!nodes.length)
            return;

        var crumbs = this.crumbsElement;
        for (var crumb = crumbs.firstChild; crumb; crumb = crumb.nextSibling) {
            if (nodes.indexOf(crumb.representedObject) !== -1) {
                this.updateBreadcrumb(true);
                return;
            }
        }
    },


    _mouseMovedInCrumbs: function(event)
    {
        var nodeUnderMouse = document.elementFromPoint(event.pageX, event.pageY);
        var crumbElement = nodeUnderMouse.enclosingNodeOrSelfWithClass("crumb");

        WebInspector.domAgent.highlightDOMNode(crumbElement ? crumbElement.representedObject.id : 0);

        if ("_mouseOutOfCrumbsTimeout" in this) {
            clearTimeout(this._mouseOutOfCrumbsTimeout);
            delete this._mouseOutOfCrumbsTimeout;
        }
    },

    _mouseMovedOutOfCrumbs: function(event)
    {
        var nodeUnderMouse = document.elementFromPoint(event.pageX, event.pageY);
        if (nodeUnderMouse && nodeUnderMouse.isDescendant(this.crumbsElement))
            return;

        WebInspector.domAgent.hideDOMNodeHighlight();

        this._mouseOutOfCrumbsTimeout = setTimeout(this.updateBreadcrumbSizes.bind(this), 1000);
    },

    updateBreadcrumb: function(forceUpdate)
    {
        if (!this.isShowing())
            return;

        var crumbs = this.crumbsElement;

        var handled = false;
        var crumb = crumbs.firstChild;
        while (crumb) {
            if (crumb.representedObject === this.selectedDOMNode()) {
                crumb.addStyleClass("selected");
                handled = true;
            } else {
                crumb.removeStyleClass("selected");
            }

            crumb = crumb.nextSibling;
        }

        if (handled && !forceUpdate) {
            // We don't need to rebuild the crumbs, but we need to adjust sizes
            // to reflect the new focused or root node.
            this.updateBreadcrumbSizes();
            return;
        }

        crumbs.removeChildren();

        var panel = this;

        function selectCrumbFunction(event)
        {
            var crumb = event.currentTarget;
            if (crumb.hasStyleClass("collapsed")) {
                // Clicking a collapsed crumb will expose the hidden crumbs.
                if (crumb === panel.crumbsElement.firstChild) {
                    // If the focused crumb is the first child, pick the farthest crumb
                    // that is still hidden. This allows the user to expose every crumb.
                    var currentCrumb = crumb;
                    while (currentCrumb) {
                        var hidden = currentCrumb.hasStyleClass("hidden");
                        var collapsed = currentCrumb.hasStyleClass("collapsed");
                        if (!hidden && !collapsed)
                            break;
                        crumb = currentCrumb;
                        currentCrumb = currentCrumb.nextSibling;
                    }
                }

                panel.updateBreadcrumbSizes(crumb);
            } else
                panel.selectDOMNode(crumb.representedObject, true);

            event.preventDefault();
        }

        function getOwner(node) {
            // If this node doesn't have an owner, try the parent's owner.
            // This can happen for text nodes.
            return current.ownerNode || (current.parentNode && current.parentNode.ownerNode);
        }

        for (var current = this.selectedDOMNode(); current; current = getOwner(current)) {
            if (current.nodeType() === Node.DOCUMENT_NODE)
                continue;

            crumb = document.createElement("span");
            crumb.className = "crumb";
            crumb.representedObject = current;
            crumb.addEventListener("mousedown", selectCrumbFunction, false);

            var crumbTitle = "";
            switch (current.nodeType()) {
                case Node.ELEMENT_NODE:
                    if (current.pseudoType())
                        crumbTitle = "::" + current.pseudoType();
                    else
                        this.decorateNodeLabel(current, crumb);
                    break;

                case Node.TEXT_NODE:
                    crumbTitle = WebInspector.UIString("(text)");
                    break;

                case Node.COMMENT_NODE:
                    crumbTitle = "<!-->";
                    break;

                case Node.DOCUMENT_TYPE_NODE:
                    crumbTitle = "<!DOCTYPE>";
                    break;

                default:
                    crumbTitle = current.nodeNameInCorrectCase();
            }

            if (!crumb.childNodes.length) {
                var nameElement = document.createElement("span");
                nameElement.textContent = crumbTitle;
                crumb.appendChild(nameElement);
                crumb.title = crumbTitle;
            }

            if (current === this.selectedDOMNode())
                crumb.addStyleClass("selected");
            if (!crumbs.childNodes.length)
                crumb.addStyleClass("end");

            crumbs.insertBefore(crumb, crumbs.firstChild);
        }

        if (crumbs.hasChildNodes())
            crumbs.lastChild.addStyleClass("start");

        this.updateBreadcrumbSizes();
    },

    updateBreadcrumbSizes: function(focusedCrumb)
    {
        if (!this.isShowing())
            return;

        if (document.body.offsetWidth <= 0) {
            // The stylesheet hasn't loaded yet or the window is closed,
            // so we can't calculate what is need. Return early.
            return;
        }

        var crumbs = this.crumbsElement;
        if (!crumbs.childNodes.length || crumbs.offsetWidth <= 0)
            return; // No crumbs, do nothing.

        // A Zero index is the right most child crumb in the breadcrumb.
        var selectedIndex = 0;
        var focusedIndex = 0;
        var selectedCrumb;

        var i = 0;
        var crumb = crumbs.firstChild;
        while (crumb) {
            // Find the selected crumb and index.
            if (!selectedCrumb && crumb.hasStyleClass("selected")) {
                selectedCrumb = crumb;
                selectedIndex = i;
            }

            // Find the focused crumb index.
            if (crumb === focusedCrumb)
                focusedIndex = i;

            // Remove any styles that affect size before
            // deciding to shorten any crumbs.
            if (crumb !== crumbs.lastChild)
                crumb.removeStyleClass("start");
            if (crumb !== crumbs.firstChild)
                crumb.removeStyleClass("end");

            crumb.removeStyleClass("compact");
            crumb.removeStyleClass("collapsed");
            crumb.removeStyleClass("hidden");

            crumb = crumb.nextSibling;
            ++i;
        }

        // Restore the start and end crumb classes in case they got removed in coalesceCollapsedCrumbs().
        // The order of the crumbs in the document is opposite of the visual order.
        crumbs.firstChild.addStyleClass("end");
        crumbs.lastChild.addStyleClass("start");

        var contentElement = this.contentElement;
        function crumbsAreSmallerThanContainer()
        {
            const rightPadding = 10;
            return crumbs.offsetWidth + rightPadding < contentElement.offsetWidth;
        }

        if (crumbsAreSmallerThanContainer())
            return; // No need to compact the crumbs, they all fit at full size.

        var BothSides = 0;
        var AncestorSide = -1;
        var ChildSide = 1;

        function makeCrumbsSmaller(shrinkingFunction, direction, significantCrumb)
        {
            if (!significantCrumb)
                significantCrumb = (focusedCrumb || selectedCrumb);

            if (significantCrumb === selectedCrumb)
                var significantIndex = selectedIndex;
            else if (significantCrumb === focusedCrumb)
                var significantIndex = focusedIndex;
            else {
                var significantIndex = 0;
                for (var i = 0; i < crumbs.childNodes.length; ++i) {
                    if (crumbs.childNodes[i] === significantCrumb) {
                        significantIndex = i;
                        break;
                    }
                }
            }

            function shrinkCrumbAtIndex(index)
            {
                var shrinkCrumb = crumbs.childNodes[index];
                if (shrinkCrumb && shrinkCrumb !== significantCrumb)
                    shrinkingFunction(shrinkCrumb);
                if (crumbsAreSmallerThanContainer())
                    return true; // No need to compact the crumbs more.
                return false;
            }

            // Shrink crumbs one at a time by applying the shrinkingFunction until the crumbs
            // fit in the container or we run out of crumbs to shrink.
            if (direction) {
                // Crumbs are shrunk on only one side (based on direction) of the signifcant crumb.
                var index = (direction > 0 ? 0 : crumbs.childNodes.length - 1);
                while (index !== significantIndex) {
                    if (shrinkCrumbAtIndex(index))
                        return true;
                    index += (direction > 0 ? 1 : -1);
                }
            } else {
                // Crumbs are shrunk in order of descending distance from the signifcant crumb,
                // with a tie going to child crumbs.
                var startIndex = 0;
                var endIndex = crumbs.childNodes.length - 1;
                while (startIndex != significantIndex || endIndex != significantIndex) {
                    var startDistance = significantIndex - startIndex;
                    var endDistance = endIndex - significantIndex;
                    if (startDistance >= endDistance)
                        var index = startIndex++;
                    else
                        var index = endIndex--;
                    if (shrinkCrumbAtIndex(index))
                        return true;
                }
            }

            // We are not small enough yet, return false so the caller knows.
            return false;
        }

        function coalesceCollapsedCrumbs()
        {
            var crumb = crumbs.firstChild;
            var collapsedRun = false;
            var newStartNeeded = false;
            var newEndNeeded = false;
            while (crumb) {
                var hidden = crumb.hasStyleClass("hidden");
                if (!hidden) {
                    var collapsed = crumb.hasStyleClass("collapsed");
                    if (collapsedRun && collapsed) {
                        crumb.addStyleClass("hidden");
                        crumb.removeStyleClass("compact");
                        crumb.removeStyleClass("collapsed");

                        if (crumb.hasStyleClass("start")) {
                            crumb.removeStyleClass("start");
                            newStartNeeded = true;
                        }

                        if (crumb.hasStyleClass("end")) {
                            crumb.removeStyleClass("end");
                            newEndNeeded = true;
                        }

                        continue;
                    }

                    collapsedRun = collapsed;

                    if (newEndNeeded) {
                        newEndNeeded = false;
                        crumb.addStyleClass("end");
                    }
                } else
                    collapsedRun = true;
                crumb = crumb.nextSibling;
            }

            if (newStartNeeded) {
                crumb = crumbs.lastChild;
                while (crumb) {
                    if (!crumb.hasStyleClass("hidden")) {
                        crumb.addStyleClass("start");
                        break;
                    }
                    crumb = crumb.previousSibling;
                }
            }
        }

        function compact(crumb)
        {
            if (crumb.hasStyleClass("hidden"))
                return;
            crumb.addStyleClass("compact");
        }

        function collapse(crumb, dontCoalesce)
        {
            if (crumb.hasStyleClass("hidden"))
                return;
            crumb.addStyleClass("collapsed");
            crumb.removeStyleClass("compact");
            if (!dontCoalesce)
                coalesceCollapsedCrumbs();
        }

        if (!focusedCrumb) {
            // When not focused on a crumb we can be biased and collapse less important
            // crumbs that the user might not care much about.

            // Compact child crumbs.
            if (makeCrumbsSmaller(compact, ChildSide))
                return;

            // Collapse child crumbs.
            if (makeCrumbsSmaller(collapse, ChildSide))
                return;
        }

        // Compact ancestor crumbs, or from both sides if focused.
        if (makeCrumbsSmaller(compact, (focusedCrumb ? BothSides : AncestorSide)))
            return;

        // Collapse ancestor crumbs, or from both sides if focused.
        if (makeCrumbsSmaller(collapse, (focusedCrumb ? BothSides : AncestorSide)))
            return;

        if (!selectedCrumb)
            return;

        // Compact the selected crumb.
        compact(selectedCrumb);
        if (crumbsAreSmallerThanContainer())
            return;

        // Collapse the selected crumb as a last resort. Pass true to prevent coalescing.
        collapse(selectedCrumb, true);
    },

    updateInstance: function()
    {
        var node = this.selectedDOMNode();
        if (!node) return;
        WebInspector.RemoteObject.resolveNode(node, 'react_panel_instance', nodeResolved.bind(this));
        function nodeResolved(object)
        {
            var pane = this.sidebarPanes.instance;
            if (pane.isShowing() && pane.needsUpdate) {
                pane.update(object);
            }
            if (object) {
                object.getOwnProperties(propertiesResolved.bind(this));
            }
        }

        function propertiesResolved(properties) {
            var props = WebInspector.RemoteObject.fromPrimitiveValue(null);
            var state = WebInspector.RemoteObject.fromPrimitiveValue(null);
            for (var i = 0; i < properties.length; ++i) {
                if (properties[i].name == 'props') {
                    props = properties[i].value;
                }
                if (properties[i].name == 'state') {
                    state = properties[i].value;
                }
            }
            var pane = this.sidebarPanes.props;
            if (pane.isShowing() && pane.needsUpdate) {
                pane.update(props);
            }
            pane = this.sidebarPanes.state;
            if (pane.isShowing() && pane.needsUpdate) {
                pane.update(state);
            }
        }
    },

    updateEventListeners: function()
    {
        var eventListenersSidebarPane = this.sidebarPanes.eventListeners;
        if (!eventListenersSidebarPane.isShowing() || !eventListenersSidebarPane.needsUpdate)
            return;

        eventListenersSidebarPane.update(this.selectedDOMNode());
        eventListenersSidebarPane.needsUpdate = false;
    },

    handleShortcut: function(event)
    {
        function handleUndoRedo()
        {
            if (WebInspector.KeyboardShortcut.eventHasCtrlOrMeta(event) && !event.shiftKey && event.keyIdentifier === "U+005A") { // Z key
                WebInspector.domAgent.undo(this._updateSidebars.bind(this));
                event.handled = true;
                return;
            }

            var isRedoKey = WebInspector.isMac() ? event.metaKey && event.shiftKey && event.keyIdentifier === "U+005A" : // Z key
                                                   event.ctrlKey && event.keyIdentifier === "U+0059"; // Y key
            if (isRedoKey) {
                DOMAgent.redo(this._updateSidebars.bind(this));
                event.handled = true;
            }
        }

        if (!this.treeOutline.editing()) {
            handleUndoRedo.call(this);
            if (event.handled)
                return;
        }

        this.treeOutline.handleShortcut(event);
    },

    handleCopyEvent: function(event)
    {
        // Don't prevent the normal copy if the user has a selection.
        if (!window.getSelection().isCollapsed)
            return;
        event.clipboardData.clearData();
        event.preventDefault();
        this.selectedDOMNode().copyNode();
    },

    sidebarResized: function(event)
    {
        this.treeOutline.updateSelection();
    },

    _inspectElementRequested: function(event)
    {
        var node = event.data;
        this.revealAndSelectNode(node.id);
    },

    revealAndSelectNode: function(nodeId)
    {
        // WebInspector.inspectorView.setCurrentPanel(this);

        var node = WebInspector.domAgent.nodeForId(nodeId);
        if (!node)
            return;

        WebInspector.domAgent.highlightDOMNodeForTwoSeconds(nodeId);
        this.selectDOMNode(node, true);
    },

    appendApplicableItems: function(event, contextMenu, target)
    {
        function selectNode(nodeId)
        {
            if (nodeId)
                WebInspector.domAgent.inspectElement(nodeId);
        }

        function revealElement(remoteObject)
        {
            remoteObject.pushNodeToFrontend(selectNode);
        }

        var commandCallback;
        if (target instanceof WebInspector.RemoteObject) {
            var remoteObject = (target);
            if (remoteObject.subtype === "node")
                commandCallback = revealElement.bind(this, remoteObject);
        } else if (target instanceof WebInspector.DOMNode) {
            var domNode = (target);
            if (domNode.id)
                commandCallback = WebInspector.domAgent.inspectElement.bind(WebInspector.domAgent, domNode.id);
        }
        if (!commandCallback)
            return;
        // Skip adding "Reveal..." menu item for our own tree outline.
        if (this.treeOutline.element.isAncestor(event.target))
            return;
        contextMenu.appendItem(WebInspector.useLowerCaseMenuTitles() ? "Reveal in Elements panel" : "Reveal in Elements Panel", commandCallback);
    },

    _sidebarContextMenuEventFired: function(event)
    {
        var contextMenu = new WebInspector.ContextMenu(event);
        contextMenu.show();
    },

    _dockSideChanged: function()
    {
        var vertically = false;
        this._splitVertically(vertically);
    },

    _splitVertically: function(vertically)
    {
        if (this.sidebarPaneView && vertically === !this.splitView.isVertical())
            return;

        if (this.sidebarPaneView)
            this.sidebarPaneView.detach();

        this.splitView.setVertical(!vertically);

        if (!vertically) {
            this.sidebarPaneView = new WebInspector.SidebarPaneStack();
        } else {
            this.sidebarPaneView = new WebInspector.SidebarTabbedPane();
        }
        for (var pane in this.sidebarPanes)
            this.sidebarPaneView.addPane(this.sidebarPanes[pane]);
        this.sidebarPaneView.show(this.splitView.sidebarElement);
    },

    forceUpdate: function()
    {
        var node = this.selectedDOMNode();
        if (!node) return;
        WebInspector.RemoteObject.resolveNode(node, 'react_panel_instance', nodeResolved.bind(this));
        function nodeResolved(object)
        {
            function forceUpdate() {
                if (this.forceUpdate) {
                    this.forceUpdate();
                }
            }

            if (object) {
                object.callFunction(forceUpdate);
            }
        }
    },

    __proto__: WebInspector.View.prototype
}
