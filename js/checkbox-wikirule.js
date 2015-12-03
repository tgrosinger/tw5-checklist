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

exports.parse = function() {
    var listItems = [];
    var listStartPos = this.parser.pos;
    var match = this.match;

    // Start the list with a "New List Item" placeholder
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

        // Put the listitem body in a span for easy reference
        var itembody = {
            type: "element",
            tag: "span",
            attributes: {
                class: {type: "string", value: "checklistitem-body"}
            },
            children: parseResults.tree
        };

        var checkbox = {
            type: "element",
            tag: "input",
            attributes: {
                type: {type: "string", value: "checkbox"},
                pos: {type: "string", value: match.index}
            }
        };
        if (match[1] === "x" || match[1] === "X") {
            checkbox.attributes.checked = {type: "boolean", value: true};
        }

        var removeicon = {
            type: "element",
            tag: "div",
            attributes: {
                class: {type: "string", value: "checklist-removeitem-icon"}
            },
            children: [
                // Fancy X icon
                {type: "entity", entity: "&#x2716;"}
            ]
        };

        listItems.push({
            type: "element",
            tag: "li",
            children: [
                checkbox,
                itembody,
                removeicon
            ]
        });

        match = this.matchRegExp.exec(this.parser.source);
    } while (match != null && match.index == 1 + this.parser.pos);

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
