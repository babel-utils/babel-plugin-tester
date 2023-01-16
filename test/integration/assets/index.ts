import { readFileSync } from 'node:fs';

export const assets = {
  invocation: {
    main: readFileSync(`${__dirname}/main/invocation.js`, 'utf8'),
    pure: readFileSync(`${__dirname}/pure/invocation.js`, 'utf8')
  },
  invocationOnly: {
    main: readFileSync(`${__dirname}/main/invocation-only.js`, 'utf8'),
    pure: readFileSync(`${__dirname}/pure/invocation-only.js`, 'utf8')
  },
  invocationSkip: {
    main: readFileSync(`${__dirname}/main/invocation-skip.js`, 'utf8'),
    pure: readFileSync(`${__dirname}/pure/invocation-skip.js`, 'utf8')
  },
  invocationSnapshot: {
    main: readFileSync(`${__dirname}/main/invocation-snapshot.js`, 'utf8'),
    pure: readFileSync(`${__dirname}/pure/invocation-snapshot.js`, 'utf8')
  },
  dummyFixtureAssetCode: {
    main: readFileSync(`${__dirname}/main/fixtures/dummy-fixture-asset/code.js`, 'utf8'),
    pure: readFileSync(`${__dirname}/pure/fixtures/dummy-fixture-asset/code.js`, 'utf8')
  },
  dummyFixtureAssetOptions: {
    main: readFileSync(
      `${__dirname}/main/fixtures/dummy-fixture-asset/options.js`,
      'utf8'
    ),
    pure: readFileSync(
      `${__dirname}/pure/fixtures/dummy-fixture-asset/options.js`,
      'utf8'
    )
  },
  dummyFixtureAssetOutput: {
    main: readFileSync(
      `${__dirname}/main/fixtures/dummy-fixture-asset/output.js`,
      'utf8'
    ),
    pure: readFileSync(`${__dirname}/pure/fixtures/dummy-fixture-asset/output.js`, 'utf8')
  },
  pluginIdentifierReverse: readFileSync(
    `${__dirname}/plugin-identifier-reverse.js`,
    'utf8'
  )
};
