const {
  select,
  ascending,
  partition,
  hierarchy,
  scaleLinear,
  easeCubic,
} = require('d3');
const d3Tip = require('d3-tip');

require('./flamegraph.css');

module.exports = function createFlamegraph() {
  var w = 960; // graph width
  var h = null; // graph height
  var c = 18; // cell height
  var selection = null; // selection
  var tooltip = true; // enable tooltip
  var title = ''; // graph title
  var transitionDuration = 250;
  var transitionEase = easeCubic; // tooltip offset
  var sort = false;
  var inverted = true; // invert the graph direction
  var clickHandler = null;
  var minFrameSize = 0;
  var details = null;

  var tip = d3Tip()
    .direction('s')
    .offset([8, 0])
    .attr('class', 'd3-flame-graph-tip')
    .html(function(d) {
      return label(d);
    });

  var svg;

  function name(d) {
    return d.data.n || d.data.name;
  }

  function children(d) {
    return d.c || d.children;
  }

  function value(d) {
    return d.v || d.value;
  }

  var label = function(d) {
    return d.data.tooltip;
  };

  function setDetails(t) {
    if (details) {
      details.innerHTML = t;
    }
  }

  var colorMapper = function(d) {
    return d.data.color;
  };

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
    siblings.forEach(function(s) {
      hide(s);
    });
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

  // function getRoot (d) {
  //   if (d.parent) {
  //     return getRoot(d.parent)
  //   }
  //   return d
  // }

  function zoom(d) {
    tip.hide(d);
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
        children(innerD).forEach(function(child) {
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
      children(d).forEach(function(child) {
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
      var kx = w / (root.x1 - root.x0);
      nodeList = nodeList.filter(function(el) {
        return (el.x1 - el.x0) * kx > minFrameSize;
      });
    }
    return nodeList;
  }

  function update() {
    selection.each(function(root) {
      var x = scaleLinear().range([0, w]);
      var y = scaleLinear().range([0, c]);

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

      var kx = w / (root.x1 - root.x0);
      function width(d) {
        return (d.x1 - d.x0) * kx;
      }

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
            (inverted ? y(d.depth) : h - y(d.depth) - c) +
            ')'
          );
        });

      g.select('rect').attr('width', width);

      var node = g
        .enter()
        .append('svg:g')
        .attr('transform', function(d) {
          return (
            'translate(' +
            x(d.x0) +
            ',' +
            (inverted ? y(d.depth) : h - y(d.depth) - c) +
            ')'
          );
        });

      node
        .append('svg:rect')
        .transition()
        .delay(transitionDuration / 2)
        .attr('width', width);

      if (!tooltip) {
        node.append('svg:title');
      }

      node.append('foreignObject').append('xhtml:div');

      // Now we have to re-select to see the new elements (why?).
      g = select(this)
        .select('svg')
        .selectAll('g')
        .data(descendants, function(d) {
          return d.data.id;
        });

      g
        .attr('width', width)
        .attr('height', function(d) {
          return c;
        })
        .attr('name', function(d) {
          return name(d);
        })
        .attr('class', function(d) {
          return d.data.fade ? 'frame fade' : 'frame';
        });

      g
        .select('rect')
        .attr('height', function(d) {
          return c;
        })
        .attr('fill', function(d) {
          return colorMapper(d);
        });

      if (!tooltip) {
        g.select('title').text(label);
      }

      g
        .select('foreignObject')
        .attr('width', width)
        .attr('height', function() {
          return c;
        })
        .select('div')
        .attr('class', d => d.data.labelClassName)
        .style('display', function(d) {
          return width(d) < 35 ? 'none' : 'block';
        })
        .transition()
        .delay(transitionDuration)
        .text(name);

      g.on('click', zoom);

      g.exit().remove();

      g
        .on('mouseover', function(d) {
          if (tooltip) {
            tip.show(d, this);
          }
          setDetails(label(d));
        })
        .on('mouseout', function(d) {
          if (tooltip) {
            tip.hide(d);
          }
          setDetails('');
        });
    });
  }

  function merge(data, samples) {
    const find = (nodes, id) => nodes.find(node => node.id === id);

    samples.forEach(function(sample) {
      var node = find(data, sample.id);
      if (node) {
        // eslint-disable-next-line no-unused-vars
        const { children: _, ...rest } = sample;
        Object.assign(node, rest);

        // Merge existing children, so selection is maintained,
        // And animations work properly.
        node.children = node.children.filter(child => find(samples, child.id));
        merge(node.children, sample.children);
      } else {
        data.push(sample);
      }
    });
  }

  function chart(s) {
    var root = hierarchy(s.datum(), function(d) {
      return children(d);
    });
    selection = s.datum(root);

    if (!arguments.length) {
      return;
    }

    if (!h) {
      h = (root.height + 2) * c;
    }

    selection.each(function(data) {
      if (!svg) {
        svg = select(this)
          .append('svg:svg')
          .attr('width', w)
          .attr('height', h)
          .attr('class', 'partition d3-flame-graph')
          .call(tip);

        svg
          .append('svg:text')
          .attr('class', 'title')
          .attr('text-anchor', 'middle')
          .attr('y', '25')
          .attr('x', w / 2)
          .attr('fill', '#808080')
          .text(title);
      }
    });

    // first draw
    update();
  }

  chart.height = function(_) {
    if (!arguments.length) {
      return h;
    }
    h = _;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) {
      return w;
    }
    w = _;
    return chart;
  };

  chart.cellHeight = function(_) {
    if (!arguments.length) {
      return c;
    }
    c = _;
    return chart;
  };

  chart.title = function(_) {
    if (!arguments.length) {
      return title;
    }
    title = _;
    return chart;
  };

  chart.transitionDuration = function(_) {
    if (!arguments.length) {
      return transitionDuration;
    }
    transitionDuration = _;
    return chart;
  };

  chart.transitionEase = function(_) {
    if (!arguments.length) {
      return transitionEase;
    }
    transitionEase = _;
    return chart;
  };

  chart.sort = function(_) {
    if (!arguments.length) {
      return sort;
    }
    sort = _;
    return chart;
  };

  chart.label = function(_) {
    if (!arguments.length) {
      return label;
    }
    label = _;
    return chart;
  };

  chart.search = function(term) {
    var searchResults = [];
    selection.each(function(data) {
      searchResults = searchTree(data, term);
      update();
    });
    return searchResults;
  };

  chart.clear = function() {
    selection.each(function(data) {
      clear(data);
      update();
    });
  };

  chart.zoomTo = function(d) {
    zoom(d);
  };

  chart.resetZoom = function() {
    selection.each(function(data) {
      zoom(data); // zoom to root
    });
  };

  chart.onClick = function(_) {
    if (!arguments.length) {
      return clickHandler;
    }
    clickHandler = _;
    return chart;
  };

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

  chart.color = function(_) {
    if (!arguments.length) {
      return colorMapper;
    }
    colorMapper = _;
    return chart;
  };

  chart.minFrameSize = function(_) {
    if (!arguments.length) {
      return minFrameSize;
    }
    minFrameSize = _;
    return chart;
  };

  chart.details = function(_) {
    if (!arguments.length) {
      return details;
    }
    details = _;
    return chart;
  };

  return chart;
};
