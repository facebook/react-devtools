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

var Agent = require('../Agent');

describe('Agent', () => {

  const publicInstance1 = {};
  const publicInstance2 = {};
  let agent;
  beforeEach(() => {
    agent = new Agent({});
    agent.elementData.set('test1', { publicInstance: publicInstance1 });
    agent.elementData.set('test2', { publicInstance: publicInstance2 });
  });

  it('sets global $r if it is not set', () => {
    delete agent.global.$r;
    agent.emit('selected', 'test1');
    expect(agent.global.$r).toBe(publicInstance1);
  });

  it('overwrites global $r if it was last set by itself', () => {
    agent.emit('selected', 'test1');
    expect(agent.global.$r).toBe(publicInstance1);
    agent.emit('selected', 'test2');
    expect(agent.global.$r).toBe(publicInstance2);
  });

  it('does not overwrite global $r if was not last set by itself', () => {
    agent.emit('selected', 'test1');
    expect(agent.global.$r).toBe(publicInstance1);
    agent.global.$r = 'set externally';
    expect(agent.global.$r).toBe('set externally');
    agent.emit('selected', 'test1');
    expect(agent.global.$r).toBe('set externally');
  });

});
