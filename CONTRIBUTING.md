# Contributing

Thanks for being willing to contribute!

**Working on your first Pull Request?** You can learn how from this _free_
series [How to Contribute to an Open Source Project on GitHub][egghead]

## Project Setup

1. Fork and clone the repo.
2. `$ npm ci` to install dependencies without affecting the `package-lock.json`
   file.
3. `$ npm run test` to validate you've got it working.
4. Create a branch for your PR.

> Tip: Keep your `master` branch pointing at the original repository and make
> pull requests from branches on your fork. To do this, run:
>
> ```shell
> git remote add upstream https://github.com/babel-utils/babel-plugin-tester
> git fetch upstream
> git branch --set-upstream-to=upstream/master master
> ```
>
> This will add the original repository as a "remote" called "upstream," Then
> fetch the git information from that remote, then set your local `master`
> branch to use the upstream master branch whenever you run `git pull`. Then you
> can make all of your pull request branches based on this `master` branch.
> Whenever you want to update your version of `master`, do a regular `git pull`.

## Committing and Pushing Changes

Please make sure to run the unit _and integration_ tests before you send your
PR. You can do so by running `npm run test:all`, which will run all possible
tests. On some Windows/WSL systems, the concurrent integration tests can be
unstable, so set the environment variable `NO_CONCURRENT=true` to run the tests
serially (which will be slow) if you encounter strange errors.

Also, this project comes with Husky git hooks that run unit tests, linters, and
formatters on the source before each commit. To prevent your contributions from
being rejected, avoid circumventing these git hooks.

## Help Needed

Please checkout the [the open issues][issues].

Also, please watch the repo and respond to questions, bug reports, and feature
requests! Thanks!

<!-- prettier-ignore-start -->
<!-- prettier-ignore-end -->

[egghead]:
  https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github
[issues]: https://github.com/kentcdodds/generator-kcd-oss/issues
