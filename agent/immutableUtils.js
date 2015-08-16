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

var Immutable = require('immutable');

var types = ['OrderedMap', 'OrderedSet',
             'Map', 'Set', 'List', 'Stack',
             'Seq'];

module.exports = {
  isImmutable: Immutable.Iterable.isIterable,
  getImmutableName(data: any): string {
    if (Immutable.Iterable.isIterable(data)) {
      var name = 'Immutable.',
          typelen = types.length;
      for (var i = 0; i < typelen; i++) {
        if (Immutable[types[i]]['is' + types[i]](data)) {
          name += types[i];
          break;
        }
      }
      return name;
    } else {
      return data.constructor.name;
    }
  },
  shallowToJS(dataStructure: any): any {
    if (!Immutable.Iterable.isIterable(dataStructure)) {
      return dataStructure;
    }

    if (Immutable.Iterable.isKeyed(dataStructure)) {
      return dataStructure.toObject();
    } else if (Immutable.Iterable.isIndexed(dataStructure) ||
               Immutable.Set.isSet(dataStructure)) {
      return dataStructure.toArray();
    }

    return dataStructure;
  }
};
