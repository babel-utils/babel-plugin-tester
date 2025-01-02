// @ts-check
'use strict';

// TODO: publish latest rejoinder package first, then update configs to use it
//const { createDebugLogger } = require('rejoinder');

/*const debug = createDebugLogger({ namespace: 'symbiote:config:ncurc' });*/

// * https://www.npmjs.com/package/npm-check-updates#configuration-files
module.exports = {
  install: 'never',
  reject: [
    // ? Reject any super-pinned dependencies (e.g. find-up~5 and execa~7)
    '*~*'
  ]
};

/*debug('exported config: %O', module.exports);*/
