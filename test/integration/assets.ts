import { readFileSync } from 'node:fs';

export const assets = {
  invocation: {
    main: readFileSync(`${__dirname}/assets/main/invocation.js`, 'utf8'),
    pure: readFileSync(`${__dirname}/assets/pure/invocation.js`, 'utf8')
  },
  invocationOnly: {
    main: readFileSync(`${__dirname}/assets/main/invocation-only.js`, 'utf8'),
    pure: readFileSync(`${__dirname}/assets/pure/invocation-only.js`, 'utf8')
  },
  invocationSkip: {
    main: readFileSync(`${__dirname}/assets/main/invocation-skip.js`, 'utf8'),
    pure: readFileSync(`${__dirname}/assets/pure/invocation-skip.js`, 'utf8')
  },
  invocationSnapshot: {
    main: readFileSync(`${__dirname}/assets/main/invocation-snapshot.js`, 'utf8'),
    pure: readFileSync(`${__dirname}/assets/pure/invocation-snapshot.js`, 'utf8')
  },
  dummyFixtureAssetCode: {
    main: readFileSync(
      `${__dirname}/assets/main/fixtures/dummy-fixture-asset/code.js`,
      'utf8'
    ),
    pure: readFileSync(
      `${__dirname}/assets/pure/fixtures/dummy-fixture-asset/code.js`,
      'utf8'
    )
  },
  dummyFixtureAssetOptions: {
    main: readFileSync(
      `${__dirname}/assets/main/fixtures/dummy-fixture-asset/options.js`,
      'utf8'
    ),
    pure: readFileSync(
      `${__dirname}/assets/pure/fixtures/dummy-fixture-asset/options.js`,
      'utf8'
    )
  },
  dummyFixtureAssetOutput: {
    main: readFileSync(
      `${__dirname}/assets/main/fixtures/dummy-fixture-asset/output.js`,
      'utf8'
    ),
    pure: readFileSync(
      `${__dirname}/assets/pure/fixtures/dummy-fixture-asset/output.js`,
      'utf8'
    )
  },
  pluginIdentifierReverse: readFileSync(
    `${__dirname}/assets/plugin-identifier-reverse.js`,
    'utf8'
  )
};
