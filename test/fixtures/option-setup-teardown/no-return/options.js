const fs = require('node:fs');

module.exports = {
  setup: () => {
    fs.writeFileSync('/dne/fake-setup-output.js', 'fake setup content 1');
  },
  teardown: () => {
    fs.writeFileSync('/dne/fake-teardown-output.js', 'fake teardown content 1');
  }
};
