/** @flow **/

import type {Map} from './imm'

function nodeMatchesText(node: Map, needle: string): boolean {
  var name = node.get('name');
  if (name) {
    if (node.get('nodeType') !== 'Wrapper' && name.toLowerCase().indexOf(needle) !== -1) {
      return true;
    }
  }
  var text = node.get('text');
  if (text && text.toLowerCase().indexOf(needle) !== -1) {
    return true;
  }
  var children = node.get('children');
  if ('string' === typeof children && children.toLowerCase().indexOf(needle) !== -1) {
    return true;
  }
  return false;
}

module.exports = nodeMatchesText;
