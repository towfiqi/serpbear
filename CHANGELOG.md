# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.2.4](https://github.com/towfiqi/serpbear/compare/v0.2.3...v0.2.4) (2023-02-15)


### Features

* Keyword ranking pages can now be clicked. ([c5af94a](https://github.com/towfiqi/serpbear/commit/c5af94a1469713ed4092253d26953ee0ed28c25d))


### Bug Fixes

* Fixes broken Login on windows ([c406588](https://github.com/towfiqi/serpbear/commit/c406588953035e4177a64011c13eb0e3aedffe89))
* Fixes Node Cron memory leak issue. ([3c48d13](https://github.com/towfiqi/serpbear/commit/3c48d130b6f229a4ac27ec43ef1ea3a6640cecf6))

### [0.2.3](https://github.com/towfiqi/serpbear/compare/v0.2.2...v0.2.3) (2023-01-12)


### Features

* Ability to tag multiple keywords at once ([9e9dad7](https://github.com/towfiqi/serpbear/commit/9e9dad7631691b2a836fdd4c522b1f933b17e285)), closes [#54](https://github.com/towfiqi/serpbear/issues/54)
* Set USERNAME as well as USER variable ([b50733d](https://github.com/towfiqi/serpbear/commit/b50733defc2c06e0f92ca3e88fd1f74684eee9c0))


### Bug Fixes

* Fixes Position and View Sort. ([8139e39](https://github.com/towfiqi/serpbear/commit/8139e399c13ab8be767facef9a19c67dec06ed64)), closes [#46](https://github.com/towfiqi/serpbear/issues/46)
* Fixes wrong CTR value for Search Console Data ([cb24696](https://github.com/towfiqi/serpbear/commit/cb24696a1f47b02a11c68cd1c673ea8b1bacd144)), closes [#48](https://github.com/towfiqi/serpbear/issues/48)
* Mobile Keyword Scraping not working. ([a1108d2](https://github.com/towfiqi/serpbear/commit/a1108d240ea38ab0886ef3722b0c937ec5a45591)), closes [#58](https://github.com/towfiqi/serpbear/issues/58)
* ScrapingAnt Mobile Keyword Scrape not working ([acc0b39](https://github.com/towfiqi/serpbear/commit/acc0b39d80d4f9371967a0d425ed205c5d866eea))

### [0.2.2](https://github.com/towfiqi/serpbear/compare/v0.2.1...v0.2.2) (2022-12-25)


### Bug Fixes

* Fixes bug that prevents Saving API settings ([123ad81](https://github.com/towfiqi/serpbear/commit/123ad81dae10aa28848148d0f3da5cf1f7de7c57)), closes [#45](https://github.com/towfiqi/serpbear/issues/45)

### [0.2.1](https://github.com/towfiqi/serpbear/compare/v0.2.0...v0.2.1) (2022-12-24)

## [0.2.0](https://github.com/towfiqi/serpbear/compare/v0.1.7...v0.2.0) (2022-12-21)


### Features

* Adds better error logging for debugging issues ([9b71f84](https://github.com/towfiqi/serpbear/commit/9b71f8400bc17b75722b93cbe745543f6b30814a))
* Highlights tracked keywords in Discovery tab ([ee32435](https://github.com/towfiqi/serpbear/commit/ee32435d05c2a2ec6d446cd00e28058f07eb1ad4))
* Integrate SerpApi ([ad6a354](https://github.com/towfiqi/serpbear/commit/ad6a354cb93bc6584d71dd1216a8a03d8dba505b))
* integrates Google Search Console. ([49b4769](https://github.com/towfiqi/serpbear/commit/49b4769528d18e34c16386b73dfb662e7a9f45a0))


### Bug Fixes

* Ability to add SMTP without user/pass. ([671f89e](https://github.com/towfiqi/serpbear/commit/671f89e492b0f45d63ae7575c7d4970252c11296)), closes [#30](https://github.com/towfiqi/serpbear/issues/30)
* backend error on addind new domain ([c2b6328](https://github.com/towfiqi/serpbear/commit/c2b63280cb9d66b565dc51eb69ee960710ace895))
* Backend error on loading the domains page. ([e3bd5b9](https://github.com/towfiqi/serpbear/commit/e3bd5b9c0735939c6b06e9762a3ad041b8b05d6e))
* Email Notification was not being sent. ([0fdb43c](https://github.com/towfiqi/serpbear/commit/0fdb43c0a53460cd35daabc4703d26cb11db9601))
* Fixes Docker Deployment failure after the SC integration. ([b0bfba4](https://github.com/towfiqi/serpbear/commit/b0bfba440464f8fc7c31609c202e01416a41702d))
* hides Search Console Stats if its not connected ([b740ef3](https://github.com/towfiqi/serpbear/commit/b740ef337bbfb43f63528cac891d4cb254318dc7))
* Keyword Detail View's broken Search Result ([6a1f1d4](https://github.com/towfiqi/serpbear/commit/6a1f1d4adff89fc718c0f2ffe52a59ab15ad6c80))
* Minor UI Issues. ([89824ec](https://github.com/towfiqi/serpbear/commit/89824ece2349b510fa0b7d87b33cacd2c88efc95))

### [0.1.7](https://github.com/towfiqi/serpbear/compare/v0.1.6...v0.1.7) (2022-12-08)


### Bug Fixes

* Email notifcations now sent everyday at 3am ([f000063](https://github.com/towfiqi/serpbear/commit/f00006371d56c509eae00a72e164658c84fecd00))
* shortens hours and minutes in notif emails ([480767d](https://github.com/towfiqi/serpbear/commit/480767deb24072f9e250e4dd7bd3d710c4b6046c))
* Throws better error logs in cron for debugging ([a6af9d3](https://github.com/towfiqi/serpbear/commit/a6af9d347544f847e512c4ae55b14c640a897240))

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
