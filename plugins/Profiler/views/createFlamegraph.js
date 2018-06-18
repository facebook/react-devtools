// Forked from https://github.com/spiermar/d3-flame-graph

const {
  select,
  ascending,
  partition,
  hierarchy,
  scaleLinear,
  easeCubic,
} = require('d3');

require('./flamegraph.css');

export default function createFlamegraph(initialGraphWidth, initialGraphHeight = null) {
  let graphWidth = initialGraphWidth; // graph width
  let graphHeight = initialGraphHeight; // graph height
  let cellHeight = 18; // cell height
  let selection = null; // selection
  let title = ''; // graph title
  const transitionDuration = 250;
  const transitionEase = easeCubic; // tooltip offset
  let sort = false;
  const inverted = true; // invert the graph direction
  const clickHandler = null;
  const minFrameSize = 0;
  const minWidthToDisplay = 35;
  const details = null;

  let svg;

  function name(d) {
    return d.data.n || d.data.name;
  }

  function children(d) {
    return d.c || d.children;
  }

  function value(d) {
    return d.v || d.value;
  }

  const label = d => d.data.tooltip;

  function setDetails(t) {
    if (details) {
      details.innerHTML = t;
    }
  }

  function hide(d) {
    d.data.hide = true;
    if (children(d)) {
      children(d).forEach(hide);
    }
  }

  function show(d) {
    d.data.fade = false;
    d.data.hide = false;
    if (children(d)) {
      children(d).forEach(show);
    }
  }

  function getSiblings(d) {
    var siblings = [];
    if (d.parent) {
      var me = d.parent.children.indexOf(d);
      siblings = d.parent.children.slice(0);
      siblings.splice(me, 1);
    }
    return siblings;
  }

  function hideSiblings(d) {
    var siblings = getSiblings(d);
    siblings.forEach(hide);
    if (d.parent) {
      hideSiblings(d.parent);
    }
  }

  function fadeAncestors(d) {
    if (d.parent) {
      d.parent.data.fade = true;
      fadeAncestors(d.parent);
    }
  }

  function zoom(d) {
    hideSiblings(d);
    show(d);
    fadeAncestors(d);
    update();
    if (typeof clickHandler === 'function') {
      clickHandler(d);
    }
  }

  function searchTree(d, term) {
    var re = new RegExp(term);
    var searchResults = [];

    function searchInner(innerD) {
      var innerName = name(innerD);

      if (children(innerD)) {
        children(innerD).forEach(child => {
          searchInner(child);
        });
      }

      if (innerName.match(re)) {
        innerD.highlight = true;
        searchResults.push(innerD);
      } else {
        innerD.highlight = false;
      }
    }

    searchInner(d);
    return searchResults;
  }

  function clear(d) {
    d.highlight = false;
    if (children(d)) {
      children(d).forEach(child => {
        clear(child);
      });
    }
  }

  function doSort(a, b) {
    if (typeof sort === 'function') {
      return sort(a, b);
    } else if (sort) {
      return ascending(name(a), name(b));
    }
    return null;
  }

  var p = partition();

  function filterNodes(root) {
    var nodeList = root.descendants();
    if (minFrameSize > 0) {
      var kx = graphWidth / (root.x1 - root.x0);
      nodeList = nodeList.filter(el => (el.x1 - el.x0) * kx > minFrameSize);
    }
    return nodeList;
  }

  function update() {
    selection.each(function(root) {
      var x = scaleLinear().range([0, graphWidth]);
      var y = scaleLinear().range([0, cellHeight]);

      if (sort) {
        root.sort(doSort);
      }
      root.sum(function(d) {
        if (d.fade || d.hide) {
          return 0;
        }
        // The node's self value is its total value minus all children.
        var v = value(d);
        if (children(d)) {
          var innerC = children(d);
          for (var i = 0; i < innerC.length; i++) {
            v -= value(innerC[i]);
          }
        }
        return v;
      });
      p(root);

      var kx = graphWidth / (root.x1 - root.x0);
      const cellWidth = (d) => (d.x1 - d.x0) * kx;

      var descendants = filterNodes(root);
      var g = select(this)
        .select('svg')
        .selectAll('g')
        .data(descendants, function(d) {
          return d.data.id;
        });

      g
        .transition()
        .duration(transitionDuration)
        .ease(transitionEase)
        .attr('transform', function(d) {
          return (
            'translate(' +
            x(d.x0) +
            ',' +
            (inverted ? y(d.depth) : graphHeight - y(d.depth) - cellHeight) +
            ')'
          );
        });

      g.select('rect').attr('width', cellWidth);

      var node = g
        .enter()
        .append('svg:g')
        .attr('transform', function(d) {
          return (
            'translate(' +
            x(d.x0) +
            ',' +
            (inverted ? y(d.depth) : graphHeight - y(d.depth) - cellHeight) +
            ')'
          );
        });

      node
        .append('svg:rect')
        .transition()
        .delay(transitionDuration / 2)
        .attr('width', cellWidth);
      
      node.append('svg:title');
      node.append('foreignObject').append('xhtml:div');

      // Now we have to re-select to see the new elements (why?).
      g = select(this)
        .select('svg')
        .selectAll('g')
        .data(descendants, d => d.data.id);

      g
        .attr('width', cellWidth)
        .attr('height', () => cellHeight)
        .attr('name', d => name(d))
        .attr('class', d => d.data.fade ? 'frame fade' : 'frame');

      g
        .select('rect')
        .attr('height', cellHeight)
        .attr('fill', d => d.data.color);

      g.select('title').text(label);

      g
        .select('foreignObject')
        .attr('width', cellWidth)
        .attr('height', () => cellHeight)
        .select('div')
        .attr('class', 'd3-flame-graph-label')
        .style('display', d => cellWidth(d) < minWidthToDisplay ? 'none' : 'block')
        .transition()
        .delay(transitionDuration)
        .text(name);

      g.on('click', zoom);

      g.exit().remove();

      g
        .on('mouseover', d => setDetails(label(d)))
        .on('mouseout', d => setDetails(''));
    });
  }

  function merge(data, samples) {
    const find = (nodes, id) => nodes.find(node => node.id === id);

    samples.forEach(sample => {
      var node = find(data, sample.id);
      if (node) {
        // eslint-disable-next-line no-unused-vars
        const { children: _, ...rest } = sample;
        Object.assign(node, rest);

        // Remove children that are no longer in the graph.
        node.children = node.children.filter(child => find(samples, child.id));

        // Merge existing children, so selection is maintained,
        // And animations work properly.
        merge(node.children, sample.children);
      } else {
        data.push(sample);
      }
    });
  }

  function chart(s) {
    var root = hierarchy(s.datum(), d => children(d));
    selection = s.datum(root);

    if (!arguments.length) {
      return;
    }

    if (!graphHeight) {
      graphHeight = (root.height + 1) * cellHeight;
    }

    selection.each(function(data) {
      if (!svg) {
        svg = select(this)
          .append('svg:svg')
          .attr('width', graphWidth)
          .attr('height', graphHeight)
          .attr('class', 'partition d3-flame-graph');

        svg
          .append('svg:text')
          .attr('class', 'title')
          .attr('text-anchor', 'middle')
          .attr('y', '25')
          .attr('x', graphWidth / 2)
          .attr('fill', '#808080')
          .text(title);
      }
    });

    // first draw
    update();
  }

  chart.setHeight = function(newHeight) {
    graphHeight = newHeight;
    svg.attr('width', newHeight);
    return chart;
  };

  chart.setWidth = function(newWidth) {
    graphWidth = newWidth;
    svg.attr('width', newWidth);
    return chart;
  };

  chart.setCellHeight = function(newCellHeight) {
    cellHeight = newCellHeight;
    return chart;
  };

  chart.setTitle = function(newTitle) {
    title = newTitle;
    return chart;
  };

  chart.sort = function(newSort) {
    sort = newSort;
    return chart;
  };

  chart.search = function(term) {
    var searchResults = [];
    selection.each(data => {
      searchResults = searchTree(data, term);
      update();
    });
    return searchResults;
  };

  chart.clear = function() {
    selection.each(data => {
      clear(data);
      update();
    });
  };

  chart.zoomTo = function(data) {
    zoom(data);
  };

  chart.resetZoom = function() {
    selection.each(data => {
      zoom(data); // zoom to root
    });
  };

  chart.update = update;

  chart.merge = function(samples) {
    var newRoot; // Need to re-create hierarchy after data changes.
    selection.each(function(root) {
      merge([root.data], [samples]);
      newRoot = hierarchy(root.data, function(d) {
        return children(d);
      });
    });
    selection = selection.datum(newRoot);
    update();
  };

  return chart;
}
