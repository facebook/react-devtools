# Contributing to React Devtools

## Code of Conduct
Facebook has adopted a Code of Conduct that we expect project
participants to adhere to. Please [read the full text](https://code.facebook.com/codeofconduct)
so that you can understand what actions will and will not be tolerated.

### Pull Requests

The core team will be monitoring for pull requests.

*Before* submitting a pull request, please make sure the following is done…

1. Fork the repo and create your branch from `master`.
2. Within the repo, run `yarn install`
3. If you've added code that should be tested, add tests!
4. If you've changed APIs, update the documentation.
5. Make sure your code lints (`yarn run lint`) - we've done our best to make sure these rules match our internal linting guidelines.
6. Also make sure your code passes flow check(`yarn run typecheck`).
7. If you haven't already, complete the CLA.

### Contributor License Agreement ("CLA")

In order to accept your pull request, we need you to submit a CLA. You only need to do this once, so if you've done this for another Facebook open source project, you're good to go. If you are submitting a pull request for the first time, just let us know that you have completed the CLA and we can cross-check with your GitHub username.

Complete your CLA here: <https://developers.facebook.com/opensource/cla>

## Bugs

### Where to Find Known Issues

We will be using GitHub Issues for our public bugs. We will keep a close eye on this and try to make it clear when we have an internal fix in progress. Before filing a new task, try to make sure your problem doesn't already exist.

### Reporting New Issues

The best way to get your bug fixed is to provide a reduced test case. jsFiddle, jsBin, and other sites provide a way to give live examples. Those are especially helpful though may not work for `JSX`-based code.

### Security Bugs

Facebook has a [bounty program](https://www.facebook.com/whitehat/) for the safe disclosure of security bugs. With that in mind, please do not file public issues and go through the process outlined on that page.

## How to Get in Touch

* IRC - [#reactjs on freenode](http://webchat.freenode.net/?channels=reactjs)
* Mailing list - [reactjs on Google Groups](http://groups.google.com/group/reactjs)

## Coding Style

* Use semicolons;
* Commas last,
* 2 spaces for indentation (no tabs)
* Prefer `'` over `"`
* `"use strict";`
* 80 character line length
* "Attractive"

Please `yarn run lint`.

## License

By contributing to React, you agree that your contributions will be licensed under the [attached License](LICENSE).
