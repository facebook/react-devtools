/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

var sep = '\x1f'; // separator
// var MAX_DEPTH = 100;

function crawlChildren(
  ptype: string,
  children: Array<string>,
  nodes: Map<string, Map<string, string>>,
  depth: number,
  graph: Object,
) {
  var descendents = [];
  var keepCrawling = true; // depth < MAX_DEPTH;
  children.forEach(cid => {
    var child = nodes.get(cid);
    if (!child) {
      return;
    }
    var isCustom = child.get('nodeType') === 'Composite';
    if (isCustom) {
      var name = child.get('name');
      if (!name) {
        return;
      }
      if (!graph.nodes[name]) {
        graph.nodes[name] = 1;
      } else {
        graph.nodes[name] += 1;
      }
      var key = ptype + sep + name;
      if (graph.edges[key]) {
        graph.edges[key] += 1;
      } else {
        graph.edges[key] = 1;
      }
    }
    if (keepCrawling && name) {
      var grandChildren = child.get('children');
      if (grandChildren && Array.isArray(grandChildren)) {
        if (isCustom) {
          crawlChildren(name, grandChildren, nodes, depth + 1, graph);
        } else {
          descendents = descendents.concat(grandChildren);
        }
      }
    }
  });

  if (keepCrawling && descendents.length) {
    crawlChildren(ptype, descendents, nodes, depth + 1, graph);
  }
}

module.exports = crawlChildren;
