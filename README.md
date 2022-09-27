<!-- prettier-ignore-start -->

<!-- badges-start -->

[![Black Lives Matter!][badge-blm]][link-blm]
[![Maintenance status][badge-maintenance]][link-repo]
[![Last commit timestamp][badge-last-commit]][link-repo]
[![Open issues][badge-issues]][link-issues]
[![Pull requests][badge-pulls]][link-pulls]

<!-- badges-end -->

<!-- prettier-ignore-end -->

# babel-plugin-tester (dev fork)

This is a
[babel-plugin-tester](https://github.com/babel-utils/babel-plugin-tester) fork
that serves as my personal development environment for features of the upstream
project I'm working on.
[Go there](https://github.com/babel-utils/babel-plugin-tester) for documentation
and to report any issues or make any PRs.

As a personal potentially-unstable fork, you should not install this version of
babel-plugin-tester unless specifically instructed.

## Install

> **NEVER install this project and babel-plugin-tester at the same time!**

```shell
npm install --save-dev https://xunn.at/babel-plugin-tester
```

If you want to use a specific version of babel-plugin-tester, you can specify
its [release tag](https://github.com/Xunnamius/babel-plugin-tester/releases)
(without the prefix):

```shell
npm install --save-dev https://xunn.at/babel-plugin-tester@10.1.0
```

> Any valid [commit-ish](https://gitpkg.vercel.app/guide/#simplest-api) can be
> specified after the "@", not just version tags.

If you don't want to rely on [xunn.at](https://xunn.at), you can also
[install the package from GitHub directly](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#github-urls).

### Installing babel-plugin-tester vs this project

Being a temporary fork, this project is not published as a package, so you
cannot do `npm install ...`.

This is because, to be an actual drop in replacement for babel-plugin-tester,
this project needs to use the name "babel-plugin-tester" (e.g. to satisfy peer
dependencies). Of course, only the _real_ babel-plugin-tester can be installed
as "babel-plugin-tester", but we can get around that by using
`"https://xunn.at/babel-plugin-tester"` in lieu of a version in `package.json`:

```javascript
{
  ...
  "devDependencies": {
    ...
    "babel-plugin-tester": "https://xunn.at/babel-plugin-tester"
    ...
  }
}
```

This is what the [above](#install) command does for you automatically.

## Fork Structure and Maintenance

This fork is structured to be automatically rebased onto upstream releases when
they occur. To facilitate this, care must be taken when committing changes to
this repo. Specifically:

- The HEAD of the `master` branch MUST ALWAYS be the `release: bump version`
  commit. This allows the upstream synchronization script to do its job.
- All changes should happen on the `master` branch.
- Changes should be added to existing commits via `git commit --amend` and then
  force pushed via `git push --force`. If amending a pre-existing commit is not
  desirable for whatever reason, the new commit should be rebased _under_ the
  `release: bump version` commit.
- Never make custom releases or mess with the fork-specific git tags. These are
  automatically managed by the upstream synchronization script.

For example, suppose we updated the `README.md` file and want to commit the
changes:

```shell
git add README.md
git commit -m mergeme
git rebase -S -i HEAD~5 --no-verify
# Either make the mergeme commit a "fixup" to a pre-existing commit or
# reposition it to occur below HEAD
git push --force
```

Any changes between `master` and the latest upstream release will be minted into
a new local release _only after upstream makes a new release_. Until then, any
changes will only be visible to those utilizing the `master` branch directly.

[badge-blm]: https://xunn.at/badge-blm 'Join the movement!'
[link-blm]: https://xunn.at/donate-blm
[badge-maintenance]:
  https://img.shields.io/maintenance/active/2022
  'Is this
    package maintained?'
[link-repo]: https://github.com/xunnamius/babel-plugin-tester
[badge-last-commit]:
  https://img.shields.io/github/last-commit/xunnamius/babel-plugin-tester
  'Latest commit timestamp'
[badge-issues]:
  https://img.shields.io/github/issues/Xunnamius/babel-plugin-tester
  'Open
    issues'
[link-issues]: https://github.com/Xunnamius/babel-plugin-tester/issues?q=
[badge-pulls]:
  https://img.shields.io/github/issues-pr/xunnamius/babel-plugin-tester
  'Open pull requests'
[link-pulls]: https://github.com/xunnamius/babel-plugin-tester/pulls
