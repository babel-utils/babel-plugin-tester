import type { SnapshotSerializer } from '..';

/**
 * If you're using jest and snapshots, then the snapshot output could have a
 * bunch of bothersome `\"` to escape quotes because when Jest serializes a
 * string, it will wrap everything in double quotes.
 *
 * This snapshot serializer removes these quotes.
 */
export const unstringSnapshotSerializer: SnapshotSerializer = {
  test: (val: unknown) => typeof val === 'string',
  print: (val: unknown) => String(val)
};

export default unstringSnapshotSerializer;
