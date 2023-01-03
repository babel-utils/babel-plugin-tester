const fs = require('node:fs');

module.exports = {
  setup: async () => {
    fs.writeFileSync('/dne/fake-setup-output.js', 'fake setup content 3');
    return Promise.resolve(() => fs.writeFileSync('/dne/fake-teardown-output.js', 'fake teardown content 3'));
  },
  teardown: async () => {
    fs.writeFileSync('/dne/fake-teardown-output.js', 'fake teardown content 4');
  }
};
