# Maintaining

This is documentation for maintainers of this project.

## Code of Conduct

Please review, understand, and be an example of it. Violations of the code of
conduct are taken seriously, even (especially) for maintainers.

## Issues

We want to support and build the community. We do that best by helping people
learn to solve their own problems. We have an issue template and hopefully most
folks follow it. If it's not clear what the issue is, invite them to create a
minimal reproduction of what they're trying to accomplish or the bug they think
they've found.

Once it's determined that a code change is necessary, point people to
[makeapullrequest.com][1] and invite them to make a pull request. If they're the
one who needs the feature, they're the one who can build it. If they need some
hand holding and you have time to lend a hand, please do so. It's an investment
into another human being, and an investment into a potential maintainer.

Remember that this is open source, so the code is not yours, it's ours. If
someone needs a change in the codebase, you don't have to make it happen
yourself. Commit as much time to the project as you want/need to. Nobody can ask
any more of you than that.

## Pull Requests

As a maintainer, you're fine to make your branches on the main repo or on your
own fork. Either way is fine.

When we receive a pull request, a GitHub Actions build is kicked off
automatically (see [`.github/workflows`][2]). We avoid merging anything that
fails the Actions workflow.

Please review PRs and focus on the code rather than the individual. You never
know when this is someone's first ever PR and we want their experience to be as
positive as possible, so be uplifting and constructive.

When you merge the pull request, 99% of the time you should use the [Squash and
merge][3] feature. This keeps our git history clean, but more importantly, this
allows us to make any necessary changes to the commit message so we release what
we want to release. See the next section on Releases for more about that.

## Release

Our releases are automatic. They happen whenever code lands into `master`. A
GitHub Actions build gets kicked off and if it's successful, a tool called
[`semantic-release`][4] is used to automatically publish a new release to npm as
well as a changelog to GitHub. It is only able to determine the version and
whether a release is necessary by the git commit messages. With this in mind,
**please brush up on [the commit message convention][commit] which drives our
releases.**

> One important note about this: Please make sure that commit messages do NOT
> contain the words "BREAKING CHANGE" in them unless we want to push a major
> version. I've been burned by this more than once where someone will include
> "BREAKING CHANGE: None" and it will end up releasing a new major version. Not
> a huge deal honestly, but kind of annoying...

### Manual Releases

This project has an automated release set up. So things are only released when
there are useful changes in the code that justify a release. But sometimes
things get messed up one way or another and we need to trigger the release
ourselves. When this happens, simply bump the number below and commit that with
the following commit message based on your needs:

#### Major

    fix(release): manually release a major version

    There was an issue with a major release, so this manual-releases.md
    change is to release a new major version.

    Reference: #<the number of a relevant pull request, issue, or commit>

    BREAKING CHANGE: <mention any relevant breaking changes (this is what triggers the major version change so don't skip this!)>

#### Minor

    feat(release): manually release a minor version

    There was an issue with a minor release, so this manual-releases.md
    change is to release a new minor version.

    Reference: #<the number of a relevant pull request, issue, or commit>

#### Patch

    fix(release): manually release a patch version

    There was an issue with a patch release, so this manual-releases.md
    change is to release a new patch version.

    Reference: #<the number of a relevant pull request, issue, or commit>

The number of times we've had to do a manual release is: 1

## Thanks!

Thank you so much for helping to maintain this project!

[commit]:
  https://github.com/conventional-changelog-archived-repos/conventional-changelog-angular/blob/ed32559941719a130bb0327f886d6a32a8cbc2ba/convention.md
[1]: http://makeapullrequest.com
[2]: ./github/workflows
[3]: https://help.github.com/articles/merging-a-pull-request/
[4]: https://github.com/semantic-release/semantic-release
