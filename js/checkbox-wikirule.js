/*\
title: $:/plugins/tgrosinger/tw5-checklist/checkbox-wikirule.js
type: application/javascript
module-type: wikirule
\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "checkbox";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;

	// Match on [ ], [x], and [X], to the end of the line
	this.matchRegExp = /^\[([ xX])\] .*$/mg;
};

/*
Retrieve the configuration state of the clear all button
*/

exports.shouldShowClearAll = function() {
    var configWidgetTitle = "$:/plugins/tgrosinger/tw5-checklist/Configuration";
    var configWidgetFields = $tw.wiki.getTiddler(configWidgetTitle).fields;
    var showClearAll = configWidgetFields["show-clearall"] || "true";
    return (showClearAll === "true");
}


exports.parse = function() {
    var listItems = [];
    var listStartPos = this.parser.pos;
    var match = this.match;

    // Start the list with a "New List Item" placeholder – TODO: make a form
    listItems.push({
        type: "element",
        tag: "li",
        children: [
            {
                type: "element",
                tag: "span",
                attributes: {
                    class: {type: "string", value: "checklist-newitem-icon"}
                },
                children: [
                    // Fancy pencil icon
                    {type: "entity", entity: "&#x270e;"}
                ]
            },
            {
                type: "element",
                tag: "input",
                attributes: {
                    class: {type: "string", value: "checklist-newitem"},
                    placeholder: {type: "string", value: "New list item (WikiText)"}
                }
            }
        ]
    });

    do {
        var startPos = this.parser.pos;
        this.parser.pos = this.matchRegExp.lastIndex;
        var parseResults = this.parser.wiki.parseText(
                "text/vnd.tiddlywiki",
                this.parser.source.substring(startPos + 4, this.parser.pos),
                {parseAsInline: true});

        // Use the listitem body as a label for the checkbox to get better accessibility
        var checkbox = {
            type: "element",
            tag: "input",
            attributes: {
                type: {type: "string", value: "checkbox"},
                pos: {type: "string", value: match.index},
                id: {type: "string", value: match.index}
            }
        };
        if (match[1] === "x" || match[1] === "X") {
            checkbox.attributes.checked = {type: "boolean", value: true};
        }

        var itembody = {
            type: "element",
            tag: "label",
            attributes: {
                class: {type: "string", value: "checklistitem-body"},
                for: {type: "string", value: match.index}
            },
            children: parseResults.tree
        };

        // Make a button to remove the list item – TODO: use svg bin icon
/*
  <svg style="display: none">
    <symbol id="bin-icon" viewBox="0 0 20 20">
      <path d="[path data here]">
    </symbol>
  </svg>
…
<button aria-label="delete">
  <svg>
    <use xlink:href="#bin-icon"></use>
  </svg>
</button>
*/
        var removebutton = {
            type: "element",
            tag: "button",
            attributes: {
                class: {type: "string", value: "tc-btn-invisible tc-btn-mini"},
                title: {type: "string", value: "delete"}
            },
            children: [
                // Fancy X icon
                {type: "entity", entity: "&times;"}
            ]
        };

        listItems.push({
            type: "element",
            tag: "li",
            children: [
                checkbox,
                itembody,
                removebutton
            ]
        });

        match = this.matchRegExp.exec(this.parser.source);
    } while (match != null && match.index == 1 + this.parser.pos);

    if (this.shouldShowClearAll()) {
        // show the clear-all button
        listItems.push({
            type: "element",
            tag: "li",
            children: [
                {
                    type: "element",
                    tag: "input",
                    attributes: {
                        class: {type: "string", value: "checklist-clearall"},
                        type: {type: "string", value: "button"},
                        value: {type: "string", value: "↻ Clear all"}
                    }
                }
            ]
        });
    }

    return [{
        type: "checklist",
        attributes: {
            listStartPos: {type: "string", value: listStartPos},
            listStopPos:  {type: "string", value: this.parser.pos}
        },
        children: listItems
    }];
};

})();
