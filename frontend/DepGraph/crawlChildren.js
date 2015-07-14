
var sep = '\x1f'; // separator
// var MAX_DEPTH = 100;

function crawlChildren(ptype, children, nodes, depth, graph) {
  var grandchildren = [];
  var keepCrawling = true;//depth < MAX_DEPTH;
  children.forEach(cid => {
    var child = nodes.get(cid);
    var isCustom = child.get('nodeType') === 'Composite';
    if (isCustom) {
      var name = child.get('name');
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
    if (keepCrawling) {
      var children = child.get('children');
      if (children && Array.isArray(children)) {
        if (isCustom) {
          crawlChildren(name, children, nodes, depth + 1, graph);
        } else {
          grandchildren = grandchildren.concat(children);
        }
      }
    }
  });

  if (keepCrawling && grandchildren.length) {
    crawlChildren(ptype, grandchildren, nodes, depth + 1, graph);
  }
}

module.exports = crawlChildren;
