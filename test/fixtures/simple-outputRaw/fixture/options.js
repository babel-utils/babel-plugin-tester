module.exports = {
  outputRaw: (output) => {
    expect(output?.metadata).toStrictEqual({ seen: true });
  }
};
