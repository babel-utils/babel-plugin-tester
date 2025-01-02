import debugFactory from 'debug';

import type { SnapshotSerializer } from 'universe';

const debug = debugFactory('babel-plugin-tester:serializer');

/**
 * If you're using jest and snapshots, then the snapshot output could have a
 * bunch of bothersome `\"` to escape quotes because when Jest serializes a
 * string, it will wrap everything in double quotes.
 *
 * This snapshot serializer removes these quotes.
 */
export const unstringSnapshotSerializer: SnapshotSerializer = {
  test: (value: unknown) => {
    const isTriggered = typeof value === 'string';

    debug(`unstring serializer is triggered: ${isTriggered ? 'yes' : 'no'}`);
    return isTriggered;
  },
  print: (value: unknown) => {
    debug('original   value: %O', value);

    const serializedValue = String(value);
    debug('serialized value: %O', serializedValue);

    return serializedValue;
  }
};

export default unstringSnapshotSerializer;
