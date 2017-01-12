/**
 * @flow
 *
 * Inner state inspectors for the built in JS data types.
 */

'use strict';

import type {Hook} from './types';

export default
function attachInnerStateInspectors({ addInnerStateInspector } : Hook ) {
  addInnerStateInspector( Date, ( x : Date ) => ({
    local : `${ x.toDateString() } ${ x.toTimeString() }`,
    iso : x.toISOString(),
    timestamp : x.getTime(),
  }), true );
}
