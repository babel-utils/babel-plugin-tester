[**babel-plugin-tester**](../../../../README.md)

***

[babel-plugin-tester](../../../../README.md) / [src/serializers/unstring-snapshot](../README.md) / unstringSnapshotSerializer

# Variable: unstringSnapshotSerializer

> `const` **unstringSnapshotSerializer**: [`SnapshotSerializer`](../../../type-aliases/SnapshotSerializer.md)

Defined in: [src/serializers/unstring-snapshot.ts:14](https://github.com/Xunnamius/babel-plugin-tester/blob/91349cafb3cefac8248e86580feec53bd082321e/src/serializers/unstring-snapshot.ts#L14)

If you're using jest and snapshots, then the snapshot output could have a
bunch of bothersome `\"` to escape quotes because when Jest serializes a
string, it will wrap everything in double quotes.

This snapshot serializer removes these quotes.
