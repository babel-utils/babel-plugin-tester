module.exports = {
  setup: () => {
    throw new Error('this setup function should not run');
  },
  teardown: () => {
    throw new Error('this teardown function should not run');
  }
};
