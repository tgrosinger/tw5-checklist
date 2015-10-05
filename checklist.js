/*\
title: $:/core/modules/widgets/checklist.js
type: application/javascript
module-type: widget

Implements the <$checklist> widget - to render a list of checkboxes representing a checklist.
The name field must be specified if there is more than one checklist in a tiddler to disambiguate where the checklist data should be saved.

```
<$checklist name=""/>
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
    this.tiddlerTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));

    // Generate the name for the storage tiddler
    var name = this.getAttribute("name");
    var storageBase = "$:/checklistPlugin/data/";
    if (name !== undefined || name !== "") {
        this.storageName = storageBase + this.tiddlerTitle;
    } else {
        this.storageName = storageBase + this.tiddlerTitle + "-" + name;
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
ChecklistWidget.prototype.create = function() {
    var domNode = $tw.utils.domMaker("div",{class:"checklist"});
    var domList = document.createElement("ul");
    domNode.appendChild(domList);

    // Store the ul so we can add items to it later
    this.domList = domList;

    var listItems = this.wiki.getTiddlerData(this.storageName, {});
    for (var index in listItems) {
        var checklistItem = listItems[index];
        var listItem = document.createElement('li');

        var checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.name = "box-" + index;
        checkbox.id = "box-" + index;
        if (checklistItem.checked) {
            checkbox.checked = true;
        }

        var itemText = document.createElement('input');
        itemText.type = "text";
        itemText.value = checklistItem.text;
        itemText.id = "itemtext-" + index;

        var del = document.createElement('button');
        del.innerHTML = "✘";
        del.className = "checklist-del";
        del.id = "del-" + index;

        // add handler to change list item state when checkbox state is changed
        $tw.utils.addEventListeners(checkbox, [
            {name: "change", handlerObject: this, handlerMethod: "handleCheckboxChangeEvent"}
        ]);

        // add handler to update list item text on textbox blur
        $tw.utils.addEventListeners(itemText, [
            {name: "blur", handlerObject: this, handlerMethod: "handleItemTextChangeEvent"}
        ]);

        // add handler to delete tiddler when ✘ button is clicked
        $tw.utils.addEventListeners(del, [
            {name: "click", handlerObject: this, handlerMethod: "handleDeleteItemEvent"}
        ]);

        listItem.appendChild(checkbox);
        listItem.appendChild(itemText);
        listItem.appendChild(del);
        domList.appendChild(listItem);
    }

    var addItemButton = document.createElement('button');
    addItemButton.innerHTML = "New List Item";
    addItemButton.className = "checklist-ctrl";
    $tw.utils.addEventListeners(addItemButton, [
        {name:"click", handlerObject: this, handlerMethod: "handleAddItemButton"}
    ]);
    domNode.appendChild(addItemButton);

    var clearChecksButton = document.createElement('button');
    clearChecksButton.innerHTML = "Clear Checks";
    clearChecksButton.className = "checklist-ctrl";
    $tw.utils.addEventListeners(clearChecksButton, [
        {name:"click", handlerObject: this, handlerMethod: "handleClearChecksButton"}
    ]);
    domNode.appendChild(clearChecksButton);

    return domNode;
};

// Helper function to extract the data-tiddler index from a UI element
ChecklistWidget.prototype.extractItemID = function(event) {
    var itemName = event.target.id;
    return itemName.split("-")[1];
}

// Event handler which runs when a text box is changed (on blur)
ChecklistWidget.prototype.handleItemTextChangeEvent = function(event) {
    var index = this.extractItemID(event);
    var listItem = this.wiki.getTiddlerData(this.storageName)[index];
    listItem.text = event.target.value;
    this.updateListItem(index, listItem);
};

// Event handler which runs when the "New List Item" button is clicked
ChecklistWidget.prototype.handleAddItemButton = function(event) {
    var newItem = document.createElement('input');
    newItem.type = "text";
    newItem.placeholder = "New Item";

    $tw.utils.addEventListeners(newItem, [
        {name:"blur", handlerObject: this, handlerMethod: "handleNewItemBlur"}
    ]);

    this.domList.appendChild(newItem);

    newItem.focus();
    return true;
};

// Event handler which runs on blur of a new list item (save)
ChecklistWidget.prototype.handleNewItemBlur = function(event) {
    var text = event.target.value;
    if (text !== "") {
        this.addListItem(text);
    }

    this.refreshSelf();
};

// Event handler which runs when the "Clear Checks" button is clicked
ChecklistWidget.prototype.handleClearChecksButton = function(event) {
    var listItems = this.wiki.getTiddlerData(this.storageName, {});
    for (var index in listItems) {
        listItems[index].checked = false;
        this.updateListItem(index, listItems[index]);
    }

    this.refreshSelf();
};

// Event handler which runs when a list item delete button is clicked
ChecklistWidget.prototype.handleDeleteItemEvent = function(event) {
    var index = this.extractItemID(event);
    this.deleteListItem(index);

    this.refreshSelf();
    return true;
};

// Helper function to remove an item from the list
ChecklistWidget.prototype.deleteListItem = function(index) {
    this.updateListItem(index, undefined);

    var listItems = this.wiki.getTiddlerData(this.storageName, {});
    var lastIndex;
    for (var i in listItems) {
        lastIndex = i;
        if (i <= index) {
            continue;
        }

        this.updateListItem(i-1, listItems[i]);
    }

    if (lastIndex > index) {
        this.updateListItem(lastIndex, undefined);
    }
};

// Helper function to change the value of an item in the data tiddler
ChecklistWidget.prototype.updateListItem = function(index, data) {
    this.wiki.setText(this.storageName, "text", index, data);
};

// Helper function to add a new item to the data tiddler
ChecklistWidget.prototype.addListItem = function(text) {
    var existingListItems = this.wiki.getTiddlerData(this.storageName, {});
    var index = Object.keys(existingListItems).length + 1;
    this.updateListItem(index, {"text": text, "checked": false});
};

// Helper function to change the checked status of an item in the data tiddler
ChecklistWidget.prototype.toggleChecked = function(index) {
    var listItem = this.wiki.getTiddlerData(this.storageName)[index];
    listItem.checked = !listItem.checked;

    this.updateListItem(index, listItem);
};

// Event handler which runs when a list item checkbox is clicked
ChecklistWidget.prototype.handleCheckboxChangeEvent = function(event) {
    var index = this.extractItemID(event);
    this.toggleChecked(index);

    // refresh this widget, and thereby the child widgets AND the enclosed
    // content of this widget
    this.refreshSelf();
    return true;
};

exports.checklist = ChecklistWidget;

})();
