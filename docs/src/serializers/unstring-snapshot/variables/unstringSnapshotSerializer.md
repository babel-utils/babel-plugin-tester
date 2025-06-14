[**babel-plugin-tester**](../../../../README.md)

***

[babel-plugin-tester](../../../../README.md) / [src/serializers/unstring-snapshot](../README.md) / unstringSnapshotSerializer

# Variable: unstringSnapshotSerializer

> `const` **unstringSnapshotSerializer**: [`SnapshotSerializer`](../../../type-aliases/SnapshotSerializer.md)

Defined in: [src/serializers/unstring-snapshot.ts:14](https://github.com/babel-utils/babel-plugin-tester/blob/4d4ff268cbd4a3f5ae326c51e5487f07121f5c9d/src/serializers/unstring-snapshot.ts#L14)

If you're using jest and snapshots, then the snapshot output could have a
bunch of bothersome `\"` to escape quotes because when Jest serializes a
string, it will wrap everything in double quotes.

This snapshot serializer removes these quotes.
