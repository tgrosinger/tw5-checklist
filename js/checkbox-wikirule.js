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
	this.matchRegExp = /\[([ xX])\] .*$/mg;
};

exports.parse = function() {
    var listItems = [];
    var match = this.match;

    do {
        var startPos = this.parser.pos;
        this.parser.pos = this.matchRegExp.lastIndex;
        var parseResults = this.parser.wiki.parseText(
                undefined, // Defaults to "text/vnd.tiddlywiki"
                this.parser.source.substring(startPos + 4, this.parser.pos),
                {parseAsInline: true});

        var checkbox = {
            type: "element",
            tag: "input",
            attributes: {
                type: {type: "string", value: "checkbox"}
            }
        }
        if (match[1] === "x" || match[1] === "X") {
            checkbox.attributes.checked = {type: "boolean", value: true}
        }
        parseResults.tree.unshift(checkbox)

        listItems.push({
            type: "element",
            tag: "li",
            children: parseResults.tree
        });

        match = this.matchRegExp.exec(this.parser.source);
    } while (match != null && match.index == 1 + this.parser.pos);

    return [{
        type: "checklist",
        children: listItems
    }];
};

})();
