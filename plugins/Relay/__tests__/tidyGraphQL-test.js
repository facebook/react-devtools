/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

var tidyGraphQL = require('../tidyGraphQL');

describe('tidyGraphQL', () => {
  it('formats a simple query', () => {
    var input = 'Query test { node(id: 4) { id }}';

    expect(tidyGraphQL(input)).toEqual([
      'Query test {',
      '  node(id: 4) {',
      '    id',
      '  }',
      '}',
    ].join('\n'));
  });

  it('formats a query with fragments', () => {
    var input = `
      query withFragments {
        user(id: 4) {
          friends(first: 10) {
            ...friendFields
          },
          mutualFriends(first: 10) {
            ...friendFields
          }
        }
      }

      fragment friendFields on User {
        id,
        name,
        profilePic(size: 50)
      }
    `.trim().replace(/\s+/g, ' ');

    expect(tidyGraphQL(input)).toEqual([
      'query withFragments {',
      '  user(id: 4) {',
      '    friends(first: 10) {',
      '      ...friendFields',
      '    },',
      '    mutualFriends(first: 10) {',
      '      ...friendFields',
      '    }',
      '  }',
      '}',
      '',
      'fragment friendFields on User {',
      '  id,',
      '  name,',
      '  profilePic(size: 50)',
      '}',
    ].join('\n'));
  });
});
