/*\
title: js/macros/story.js

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("../Utils.js");

// Parse the text of a story tiddler into an array of tiddler titles
var parseStory = function(storyText) {
	var storyLines = storyText.split("\n"),
		tiddlers = [];
	for(var t=0; t<storyLines.length; t++) {
		var title = storyLines[t].trim();
		if(title !== "") {
			tiddlers.push(title);
		}
	}
	return tiddlers;
};

// Search the children of a node looking for the required tiddler rendering
var searchTiddlerNode = function(node,renderTiddler,renderTemplate) {
	var renderAs;
	if(renderTemplate) {
		renderAs = renderTiddler;
		renderTiddler = renderTemplate;
	}
	while(node !== null) {
		if(node.getAttribute && node.getAttribute("data-tw-render-tiddler") === renderTiddler) {
			if(!renderAs || (renderAs && node.getAttribute("data-tw-render-as") == renderAs)) {
				return node;
			}
		}
		node = node.nextSibling;
	}
	return null;
};

exports.macro = {
	name: "story",
	types: ["text/html","text/plain"],
	params: {
		story: {byName: "default", type: "tiddler", optional: false},
		template: {byName: true, type: "tiddler", optional: true}
	},
	render: function(type,tiddler,store,params) {
		var tiddlers = parseStory(store.getTiddlerText(params.story)),
			output = [];
		for(var t=0; t<tiddlers.length; t++) {
			if(params.template) {
				output.push(store.renderTiddler(type,params.template,tiddlers[t]));
			} else {
				output.push(store.renderTiddler(type,tiddlers[t]));
			}
		}
		return output.join("\n");
	},
	rerender: function(node,changes,type,tiddler,store,params) {
		/*jslint browser: true */
		// Get the tiddlers we're supposed to be displaying
		var targetTiddlers = parseStory(store.getTiddlerText(params.story)),
			currNode = node.firstChild,
			nextNode;
		for(var t=0; t<targetTiddlers.length; t++) {
			// See if the node we want is already there
			var tiddlerNode = searchTiddlerNode(currNode,targetTiddlers[t],params.template);
			if(tiddlerNode === null) {
				// If not, render the tiddler
				var tmpNode = document.createElement("div");
				tmpNode.innerHTML = params.template ?
						store.renderTiddler(type,params.template,targetTiddlers[t]) :
						store.renderTiddler(type,targetTiddlers[t]);
				tiddlerNode = tmpNode.firstChild;
				node.insertBefore(tiddlerNode,currNode);
			} else {
				// Delete any nodes preceding the one we want
				while(currNode !== tiddlerNode) {
					nextNode = currNode.nextSibling;
					node.removeChild(currNode);
					currNode = nextNode;
				}
				// Refresh it
				store.refreshDomNode(tiddlerNode,changes);
				currNode = currNode.nextSibling;
			}
		}
		// Remove any unused nodes
		while(currNode !== null) {
			nextNode = currNode.nextSibling;
			node.removeChild(currNode);
			currNode = nextNode;
		}
	}
};

})();

