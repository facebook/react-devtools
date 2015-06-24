
module.exports = function (dir, bottom, collapsed, hasChildren) {
  if (dir === 'down') {
    if (bottom || collapsed || !hasChildren) {
      return 'nextSibling';
    }
    return 'firstChild';
  }

  if (dir === 'up') {
    if (!bottom || collapsed || !hasChildren) {
      return 'prevSibling';
    }
    return 'lastChild';
  }

  if (dir === 'left') {
    if (!collapsed && hasChildren) {
      if (bottom) {
        return 'top';
      }
      return 'collapse';
    }
    return 'parent';
  }

  if (dir === 'right') {
    if (collapsed && hasChildren) {
      return 'uncollapse';
    }
    if (hasChildren) {
      if (bottom) {
        return 'lastChild';
      } else {
        return 'firstChild';
      }
    }
    return null;
  }
}

