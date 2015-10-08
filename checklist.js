/*\
title: $:/core/modules/widgets/checklist.js
type: application/javascript
module-type: widget

Implements the <$checklist> widget - to render a list of checkboxes representing a checklist.

```
<$checklist />
```

\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ChecklistWidget = function(parseTreeNode,options) {
    this.initialise(parseTreeNode,options);
};

ChecklistWidget.prototype = new Widget();

ChecklistWidget.prototype.render = function(parent,nextSibling) {
    this.allowActionPropagation();
    this.parentDomNode = parent;
    this.computeAttributes();
    this.execute();
    var domNode = this.create(parent,nextSibling);
    this.domNodes.push(domNode);
    parent.insertBefore(domNode,nextSibling);

    // We don't want to render the actual text in the checkbox widget
    //this.renderChildren(domNode,null);
};

ChecklistWidget.prototype.execute = function() {
    var tiddlerTitle = this.getAttribute("tiddler", this.getVariable("currentTiddler"));
    this.draftMode = tiddlerTitle.startsWith("Draft of");

    // Do not create storage or render when in draft mode
    if (!this.draftMode) {
        this.storageName = "$:/checklistPlugin/data/" + tiddlerTitle;
        this.createStorage();
    }

    // Make child widgets
    this.makeChildWidgets();
};

// Selectively refresh the widget, returning true if the widget or children need
// re-rendering
ChecklistWidget.prototype.refresh = function(changedTiddlers) {
    var changedAttributes = this.computeAttributes();
    if(changedAttributes.filter || changedAttributes.list || changedAttributes.tiddler) {
        this.refreshSelf();
        return true;
    } else {
        return this.refreshChildren(changedTiddlers);
    }
};

ChecklistWidget.prototype.removeChildDomNodes = function() {
    $tw.utils.each(this.domNodes,function(domNode) {
        domNode.parentNode.removeChild(domNode);
    });
    this.domNodes = [];
};

// Create the actual checkbox UI, one list item for each checklist item
// Will not render checklist when in draftMode
ChecklistWidget.prototype.create = function() {
    if (this.draftMode) {
        var domNode = $tw.utils.domMaker("div", {});
        var text = document.createTextNode("Cannot render checklist while editing");
        domNode.appendChild(text);
        return domNode;
    }

    var domNode = $tw.utils.domMaker("div",{class:"checklist"});

    var addItemButton = document.createElement('button');
    addItemButton.innerHTML = "New List Item";
    addItemButton.className = "checklist-ctrl";
    $tw.utils.addEventListeners(addItemButton, [
        {name:"click", handlerObject: this, handlerMethod: "handleAddItemButton"}
    ]);
    domNode.appendChild(addItemButton);

    var domList = document.createElement("ul");
    domNode.appendChild(domList);
    this.domList = domList;

    var addItem = function(text, prefix, handler) {
        var listItem = document.createElement('li');

        var checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.name = "box-" + i;
        checkbox.id = prefix + "-box-" + i;
        if (prefix == "checked") {
            checkbox.checked = true;
        }

        var itemText = document.createElement('input');
        itemText.type = "text";
        itemText.value = text;
        itemText.id = prefix + "-itemtext-" + i;

        var del = document.createElement('button');
        del.innerHTML = "✘";
        del.className = "checklist-del";
        del.id = prefix + "-del-" + i;

        // add handler to change list item state when checkbox state is changed
        $tw.utils.addEventListeners(checkbox, [
            {name: "change", handlerObject: handler, handlerMethod: "handleCheckboxCheckEvent"}
        ]);

        // add handler to update list item text on textbox blur
        $tw.utils.addEventListeners(itemText, [
            {name: "blur", handlerObject: handler, handlerMethod: "handleItemTextChangeEvent"}
        ]);

        // add handler to delete tiddler when ✘ button is clicked
        $tw.utils.addEventListeners(del, [
            {name: "click", handlerObject: handler, handlerMethod: "handleDeleteItemEvent"}
        ]);

        listItem.appendChild(checkbox);
        listItem.appendChild(itemText);
        listItem.appendChild(del);
        domList.appendChild(listItem);
    };

    var listItems = this.wiki.getTiddlerData(this.storageName);
    for (var i = 0; i < listItems.unchecked.length; i++) {
        addItem(listItems.unchecked[i], "unchecked", this);
    }
    for (var i = 0; i < listItems.checked.length; i++) {
        addItem(listItems.checked[i], "checked", this);
    }

    var clearChecksButton = document.createElement('button');
    clearChecksButton.innerHTML = "Clear Checks";
    clearChecksButton.className = "checklist-ctrl";
    $tw.utils.addEventListeners(clearChecksButton, [
        {name:"click", handlerObject: this, handlerMethod: "handleClearChecksButton"}
    ]);
    domNode.appendChild(clearChecksButton);

    return domNode;
};

// Event handler which runs when a checkbox is clicked
ChecklistWidget.prototype.handleCheckboxCheckEvent = function(event) {
    var itemInfo = this.extractItemID(event);
    var data = this.wiki.getTiddlerData(this.storageName);

    if (itemInfo.checked == "checked") {
        data.unchecked.push(data.checked[itemInfo.index]);
        data.checked.splice(itemInfo.index, 1);
    } else {
        data.checked.unshift(data.unchecked[itemInfo.index]);
        data.unchecked.splice(itemInfo.index, 1);
    }

    this.storeNewData(data);
    this.refreshSelf();
    return true;
};

// Event handler which runs when a text box is changed (on blur)
ChecklistWidget.prototype.handleItemTextChangeEvent = function(event) {
    var itemInfo = this.extractItemID(event);
    var data = this.wiki.getTiddlerData(this.storageName);

    data[itemInfo.checked][itemInfo.index] = event.target.value;

    this.storeNewData(data);
    this.refreshSelf();
    return true;
};

// Event handler which runs when the "New List Item" button is clicked
ChecklistWidget.prototype.handleAddItemButton = function(event) {
    var newItem = document.createElement('input');
    newItem.type = "text";
    newItem.placeholder = "New Item";

    $tw.utils.addEventListeners(newItem, [
        {name:"blur", handlerObject: this, handlerMethod: "handleNewItemBlur"}
    ]);

    this.domList.insertBefore(newItem, this.domList.firstChild);
    newItem.focus();
    return true;
};

// Event handler which runs on blur of a new list item (save)
ChecklistWidget.prototype.handleNewItemBlur = function(event) {
    var text = event.target.value;
    if (text !== "") {
        var data = this.wiki.getTiddlerData(this.storageName);
        data.unchecked.unshift(text);
        this.wiki.setText(this.storageName, "text", "unchecked", data.unchecked);
    }

    this.refreshSelf();
    return true;
};

// Event handler which runs when the "Clear Checks" button is clicked
ChecklistWidget.prototype.handleClearChecksButton = function(event) {
    var data = this.wiki.getTiddlerData(this.storageName);
    for (var index in data.checked) {
        data.unchecked.push(data.checked[index]);
    }

    data.checked = [];
    this.storeNewData(data);
    this.refreshSelf();
    return true;
};

// Event handler which runs when a list item delete button is clicked
ChecklistWidget.prototype.handleDeleteItemEvent = function(event) {
    var itemInfo = this.extractItemID(event);
    var data = this.wiki.getTiddlerData(this.storageName);
    data[itemInfo.checked].splice(itemInfo.index, 1);

    this.storeNewData(data);
    this.refreshSelf();
    return true;
};

// Helper function which takes an object with a "checked" and "unchecked" value
// and persists both to the underlying data tiddler
ChecklistWidget.prototype.storeNewData = function(data) {
    this.wiki.setText(this.storageName, "text", "checked", data.checked);
    this.wiki.setText(this.storageName, "text", "unchecked", data.unchecked);
};

// Helper function which returns an object containing "checked" (string) and
// "index" (int) for the list item target of an event.
ChecklistWidget.prototype.extractItemID = function(event) {
    var nameParts = event.target.id.split("-");
    var checked = nameParts[0],
        index =  nameParts[2];
    return {checked: checked, index: index};
};

// Create a new data storage tiddler for this checklist and migrate the existing
// data if necessary.
ChecklistWidget.prototype.createStorage = function() {
    if (!this.wiki.tiddlerExists(this.storageName)) {
        this.wiki.setTiddlerData(this.storageName, {"checked": [], "unchecked": []});
    } else {
        this.migrate();
    }
};

// Gracefully migrates data from < 0.0.2 to the new version
ChecklistWidget.prototype.migrate = function() {
    var data = this.wiki.getTiddlerData(this.storageName);
    var madeChange = false;

    if (data.checked === undefined) {
        this.wiki.setText(this.storageName, "text", "checked", []);
        madeChange = true;
    }
    if (data.unchecked === undefined) {
        this.wiki.setText(this.storageName, "text", "unchecked", []);
        madeChange = true;
    }

    for (var key in data) {
        if (key != "checked" && key != "unchecked") {
            var value = data[key];
            if (value.checked) {
                data.checked.unshift(value.text);
            } else {
                data.unchecked.unshift(value.text);
            }

            madeChange = true;
            this.wiki.setText(this.storageName, "text", key, undefined);
        }
    }

    if (madeChange) {
        this.storeNewData(data);
    }
};

exports.checklist = ChecklistWidget;

})();
