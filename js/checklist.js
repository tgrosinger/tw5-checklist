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
    this.tiddlerTitle = this.getVariable("currentTiddler");

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

    $tw.utils.each(domNode.childNodes, function(childNode) {
        $tw.utils.addEventListeners(childNode,
                [{name: "change", handlerObject: this, handlerMethod: "handleCheckboxEvent"}]);
    }.bind(this));

    this.parentDomNode.insertBefore(domNode, this.nextSibling);
};

CheckListWidget.prototype.handleCheckboxEvent = function(event) {
    // This check is inverted because the check action inverts the action state
    var wasChecked = !event.target.parentNode.childNodes[0].checked;
    var pos = parseInt(event.target.attributes.pos.nodeValue);

    var tiddlerBody = $tw.wiki.getTiddler(this.tiddlerTitle).fields.text;

    if (wasChecked) {
        tiddlerBody = tiddlerBody.substring(0, pos + 1) + " " + tiddlerBody.substring(pos + 2);
    } else {
        tiddlerBody = tiddlerBody.substring(0, pos + 1) + "x" + tiddlerBody.substring(pos + 2);
    }

    $tw.wiki.setText(this.tiddlerTitle, "text", null, tiddlerBody);
};

/*
Selectively refreshes the widget if needed.
Returns true if the widget or any of its children needed re-rendering
*/
CheckListWidget.prototype.refresh = function(changedTiddlers) {
    var changedAttributes = this.computeAttributes();
    // Refresh if an attribute has changed, or the type associated with
    // the target tiddler has changed
    if(changedAttributes.tiddler || changedAttributes.field || changedAttributes.index || 
            (changedTiddlers[this.editTitle] && this.getEditorType() !== this.editorType)) {
        this.refreshSelf();
        return true;
    } else {
        return this.refreshChildren(changedTiddlers);
    }
};

exports.checklist = CheckListWidget;

})();
