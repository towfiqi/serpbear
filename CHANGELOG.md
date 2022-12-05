# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.1.6](https://github.com/towfiqi/serpbear/compare/v0.1.5...v0.1.6) (2022-12-05)


### Bug Fixes

* CSS Linter issues. ([a599035](https://github.com/towfiqi/serpbear/commit/a59903551eccb3f03f2bc026673bbf9fd0d4bc1e))
* invalid json markup ([e9d7730](https://github.com/towfiqi/serpbear/commit/e9d7730ae7ec647d333713248b271bae8693e77b))
* Sort was buggy for keyword with >100 position ([d22992b](https://github.com/towfiqi/serpbear/commit/d22992bf6489b11002faba60fa06b5c467867c8b)), closes [#23](https://github.com/towfiqi/serpbear/issues/23)
* **UI:** Adds tooltip for Domain action icons. ([b450540](https://github.com/towfiqi/serpbear/commit/b450540d9593d022c94708c9679b5bf7c0279c50))

### [0.1.5](https://github.com/towfiqi/serpbear/compare/v0.1.4...v0.1.5) (2022-12-03)


### Features

* keyword not in first 100 now shows >100 ([e1799fb](https://github.com/towfiqi/serpbear/commit/e1799fb2f35ab8c0f65eb90e66dcda10b8cb6f16))


### Bug Fixes

* domains with - were not loading the keywords. ([efb565b](https://github.com/towfiqi/serpbear/commit/efb565ba0086d1b3e69ea71456a892ca254856f7)), closes [#11](https://github.com/towfiqi/serpbear/issues/11)
* failed scrape messes up lastResult data in db ([dd6a801](https://github.com/towfiqi/serpbear/commit/dd6a801ffda3eacda957dd20d2c97fb6197fbdc2))
* First search result items were being skipped. ([d6da18f](https://github.com/towfiqi/serpbear/commit/d6da18fb0135e23dd869d1fb500e12ee2e782bfa)), closes [#13](https://github.com/towfiqi/serpbear/issues/13)
* removes empty spaces when adding domain. ([a11b0f2](https://github.com/towfiqi/serpbear/commit/a11b0f223c0647537ab23564df1d2f0b29eef4ae))

### [0.1.4](https://github.com/towfiqi/serpbear/compare/v0.1.3...v0.1.4) (2022-12-01)


### Features

* Failed scrape now shows error details in UI. ([8c8064f](https://github.com/towfiqi/serpbear/commit/8c8064f222ea8177b26b6dd28866d1f421faca39))


### Bug Fixes

* Domains with www weren't loading keywords. ([3d1c690](https://github.com/towfiqi/serpbear/commit/3d1c690076a03598f0ac3f3663d905479d945897)), closes [#8](https://github.com/towfiqi/serpbear/issues/8)
* Emails were sending serps of previous day. ([6910558](https://github.com/towfiqi/serpbear/commit/691055811c2ae70ce1b878346300048c1e23f2eb))
* Fixes Broken ScrapingRobot Integration. ([1ed298f](https://github.com/towfiqi/serpbear/commit/1ed298f633a9ae5b402b431f1e50b35ffd44a6dc))
* scraper fails if matched domain  has www ([38dc164](https://github.com/towfiqi/serpbear/commit/38dc164514b066b2007f2f3b2ae68005621963cc)), closes [#6](https://github.com/towfiqi/serpbear/issues/6) [#7](https://github.com/towfiqi/serpbear/issues/7)
* scraper fails when result has domain w/o www ([6d7cfec](https://github.com/towfiqi/serpbear/commit/6d7cfec95304fa7a61beaab07f7cd6af215255c3))

### [0.1.3](https://github.com/towfiqi/serpbear/compare/v0.1.2...v0.1.3) (2022-12-01)


### Features

* Adds a search field in Country select field. ([be4db26](https://github.com/towfiqi/serpbear/commit/be4db26316e7522f567a4ce6fc27e0a0f73f89f2)), closes [#2](https://github.com/towfiqi/serpbear/issues/2)


### Bug Fixes

* could not add 2 character domains. ([5acbe18](https://github.com/towfiqi/serpbear/commit/5acbe181ec978b50b588af378d17fb3070c241d1)), closes [#1](https://github.com/towfiqi/serpbear/issues/1)
* license location. ([a45237b](https://github.com/towfiqi/serpbear/commit/a45237b230a9830461cf7fccd4c717235112713b))
* No hint on how to add multiple keywords. ([9fa80cf](https://github.com/towfiqi/serpbear/commit/9fa80cf6098854d2a5bd5a8202aa0fd6886d1ba0)), closes [#3](https://github.com/towfiqi/serpbear/issues/3)

### 0.1.2 (2022-11-30)


### Bug Fixes

* API URL should be dynamic. ([d687109](https://github.com/towfiqi/serpbear/commit/d6871097a2e8925a4222e7780f21e6088b8df467))
* Email Notification wasn't working. ([365caec](https://github.com/towfiqi/serpbear/commit/365caecc34be4630241189d1a948133254d0047a))
