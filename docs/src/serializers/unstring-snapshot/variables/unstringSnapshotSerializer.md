[**babel-plugin-tester**](../../../../README.md)

***

[babel-plugin-tester](../../../../README.md) / [src/serializers/unstring-snapshot](../README.md) / unstringSnapshotSerializer

# Variable: unstringSnapshotSerializer

> `const` **unstringSnapshotSerializer**: [`SnapshotSerializer`](../../../type-aliases/SnapshotSerializer.md)

Defined in: [src/serializers/unstring-snapshot.ts:14](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/src/serializers/unstring-snapshot.ts#L14)

If you're using jest and snapshots, then the snapshot output could have a
bunch of bothersome `\"` to escape quotes because when Jest serializes a
string, it will wrap everything in double quotes.

This snapshot serializer removes these quotes.
