// @ts-check

/**
 * @type {import('@-xun/symbiote/commands/build/changelog').ChangelogPatches}
 */
export default [
  // ? Things change, but the pre-release version stays the same :)
  [
    'Minimum supported Node.js version is now 18.19.0',
    'Minimum supported Node.js version is now 20.18.0'
  ],
  [
    String.raw`Due to prettier\@3 forcing downstream adoption of their asynchronous interface, `,
    ''
  ],
  [/^.*Update core-js to 3\.33.*$\n/m, '']
];
