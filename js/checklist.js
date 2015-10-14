/*\
title: $:/plugins/tgrosinger/tw5-checklist/checklist.js
type: application/javascript
module-type: widget
\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var CheckListWidget = function(parseTreeNode,options) {
    this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
CheckListWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
CheckListWidget.prototype.render = function(parent,nextSibling) {
    this.parentDomNode = parent;
    this.nextSibling = nextSibling;
    this.computeAttributes();
    this.execute();
};

/*
Compute the internal state of the widget
*/
CheckListWidget.prototype.execute = function() {
    var domNode = this.document.createElement("ul");
    domNode.className = "checklist";

    this.makeChildWidgets();
    this.renderChildren(domNode);
    this.parentDomNode.insertBefore(domNode, this.nextSibling);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
CheckListWidget.prototype.refresh = function(changedTiddlers) {
    var changedAttributes = this.computeAttributes();
    // Refresh if an attribute has changed, or the type associated with the target tiddler has changed
    if(changedAttributes.tiddler || changedAttributes.field || changedAttributes.index || (changedTiddlers[this.editTitle] && this.getEditorType() !== this.editorType)) {
        this.refreshSelf();
        return true;
    } else {
        return this.refreshChildren(changedTiddlers);
    }
};

exports.checklist = CheckListWidget;

})();
