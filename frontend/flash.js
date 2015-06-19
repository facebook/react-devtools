
function flash(node, flashColor, baseColor, duration) {
  node.style.transition = 'none';
  node.style.backgroundColor = flashColor;
  // force recalc
  node.offsetTop
  node.style.transition = `background-color ${duration}s ease`;
  node.style.backgroundColor = baseColor;
}

module.exports = flash;

