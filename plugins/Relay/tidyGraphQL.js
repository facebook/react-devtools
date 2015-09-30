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

function tidyGraphQL(input: String): string {
  var indent = '';

  var lastWasNewline = false;

  var parenCount = 0;
  var line = '';
  var head = [];
  var stack = [head];

  for (var i = 0; i < input.length; i++) {
    var c = input.charAt(i);
    if (c == '(') {
      parenCount++;
    } else if (c == ')') {
      parenCount--;
    }

    if (c == '{') {
      indent += '  ';
      lastWasNewline = true;

      head.push(line + '{');
      line = indent;
      head = [];
      stack.push(head);
    } else if (c == ',' && parenCount == 0) {
      head.push(line);

      lastWasNewline = true;
      line = indent;
    } else if (c == '}') {
      indent = indent.substr(2);

      head.push(line.replace(/ +$/, ''));
      head.sort();
      line = head.join(',\n');
      stack.pop();
      head = stack[stack.length - 1];
      line = head.pop() + '\n' + line + '\n' + indent + '}';
    } else if (c == ' ' && lastWasNewline) {
      continue;
    } else if (c != ' ' && i + 1 < input.length && input.charAt(i + 1) == '{') {
      line += c + ' ';
    } else {
      lastWasNewline = false;
      line += c;
    }
  }

  // TODO(jkassens) hack to format queries with fragments.
  return line.replace(/^} /gm, '}\n\n');
}

module.exports = tidyGraphQL;
