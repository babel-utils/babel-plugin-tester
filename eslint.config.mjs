// @ts-check

import {
  assertEnvironment,
  moduleExport
} from '@-xun/symbiote/assets/eslint.config.mjs';

import { createDebugLogger } from 'rejoinder';

const debug = createDebugLogger({ namespace: 'symbiote:config:eslint' });

const config = await moduleExport({
  derivedAliases: getEslintAliases(),
  ...(await assertEnvironment())
});

config.push({
  /* Add custom config here, such as disabling certain rules */
  name: 'babel-plugin-tester/custom',
  ignores: ['test/integration/assets/**']
});

export default config;

debug('exported config: %O', config);

function getEslintAliases() {
  // ! These aliases are auto-generated by symbiote. Instead of modifying them
  // ! directly, consider regenerating aliases across the entire project with:
  // ! `npx symbiote project renovate --regenerate-assets --assets-preset ...`
  return [
    ['rootverse:*', './*'],
    ['universe:*', './src/*'],
    ['universe', './src/index.ts'],
    ['testverse:*', './test/*'],
    ['typeverse:*', './types/*']
  ];
}
