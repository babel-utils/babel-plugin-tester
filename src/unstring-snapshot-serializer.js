const unstringSnapshotSerializer = {
  test: val => typeof val === 'string',
  print: val => val,
}

export default unstringSnapshotSerializer
