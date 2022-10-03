import type { SnapshotSerializer } from '.';

export const unstringSnapshotSerializer: SnapshotSerializer = {
  test: (val: unknown) => typeof val === 'string',
  print: (val: unknown) => String(val)
};

export default unstringSnapshotSerializer;
