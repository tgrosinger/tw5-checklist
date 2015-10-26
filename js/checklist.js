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
        if (childNode.childNodes[1].className === "checklist-newitem") {
            // NewListItem, do not use checkbox listener
            $tw.utils.addEventListeners(childNode.childNodes[1],
                    [{name: "keypress", handlerObject: this,
                        handlerMethod: "handleNewItemTypingEvent"}]);
            $tw.utils.addEventListeners(childNode.childNodes[1], [
                    {name: "blur", handlerObject: this, handlerMethod: "handleBlurNewItemEvent"},
                    {name: "keyup", handlerObject: this, handlerMethod: "handleBlurNewItemEvent"}
            ]);
        } else {
            // Normal list item, use checkbox listener
            $tw.utils.addEventListeners(childNode,
                    [{name: "change", handlerObject: this, handlerMethod: "handleCheckboxEvent"}]);
        }
    }.bind(this));

    this.parentDomNode.insertBefore(domNode, this.nextSibling);
};

// When the user starts typing, change the pencil icon into a checkbox
CheckListWidget.prototype.handleNewItemTypingEvent = function(event) {
    var oldNode = event.target.parentNode.childNodes[0];
    if (oldNode.nodeName == "SPAN" || oldNode.nodeName == "span") {
        var newCheckbox = document.createElement("input");
        newCheckbox.type = "checkbox";

        event.target.parentNode.replaceChild(newCheckbox, oldNode);
    }
};

// On blur or enter, save the new list item
CheckListWidget.prototype.handleBlurNewItemEvent = function(event) {
    if (event.type == "keyup" && event.keyCode != 13) {
        // This function receives both blur and keyup events.
        // Only run on blur or enter key
        return;
    }

    if (event.target.value.trim() === "") {
        // Don't save an empty list item
        return
    }

    var checklist = event.target.parentNode.parentNode;
    var firstItem = checklist.childNodes[1]
    var pos = firstItem.childNodes[0].attributes.pos.nodeValue;

    var newItem = "[ ] " + event.target.value.trim() + "\n";
    event.target.value = "";

    var tiddlerBody = $tw.wiki.getTiddler(this.tiddlerTitle).fields.text;
    tiddlerBody = tiddlerBody.substring(0, pos) + newItem + tiddlerBody.substring(pos);
    $tw.wiki.setText(this.tiddlerTitle, "text", null, tiddlerBody);
};

// Toggle the checked status when the user clicks the checkbox
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
