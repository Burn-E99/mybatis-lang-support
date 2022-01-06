# Change Log
All notable changes to the "mybatis-lang-support" extension will be documented in this file.

## [0.5.0] - 2022-01-06
- Added the namespace name to the `refIdMissingNoNamespace` error ([gh-11](/../../issues/11))
- Created legacy support setting to allow `<include refid=""/>` statements to be missing the namespace while referring to an id outside of the current namespace ([gh-21](/../../issues/21))
- Added code fix option for caret issues that wraps the raw carets in `<![CDATA[ <> ]]>` instead of encoding the carets ([gh-15](/../../issues/15))
- Added checking for partial caret issues (such as `&lt;>`), with proper quick fixes provided on the error ([gh-17](/../../issues/17))
- Added error checking for bitwise operators ([gh-13](/../../issues/13))
- Fixed caret issues not showing up when a string was in the same line as an issue ([gh-23](/../../issues/23))
- Added new quick fix suggestion for refids missing a namespace when the requested id is not on the current file's namespace ([gh-16](/../../issues/16))

## [0.4.1] - 2022-01-06
- Fixed which tags can be self closed and normal closed ([gh-10](/../../issues/10))
- Fixed caret issues not being ignored while inside a cdata tag like `<![CDATA[ <> ]]>` ([gh-14](/../../issues/14))
- Fixed errors appearing on properly closed tags in a file that has mixed normal and self closing of the same tag ([gh-18](/../../issues/18))
- Fixed ids being parsed when they were commented out and should be ignored ([gh-19](/../../issues/19))
- Fixed duplicate id errors/warnings being shown on files that do not have the id in them (related to files sharing the same namespace) ([gh-20](/../../issues/20))

## [0.4.0] - 2022-01-03
- Added new configuration to support older versions of ibatis/mybatis that used sqlMap in place of mapper ([gh-7](/../../issues/7))
- Added new code fix for refids that are missing a namespace ([gh-8](/../../issues/8))
- Added tab completion to `<include refid="` ([gh-9](/../../issues/9))

## [0.3.0] - 2022-01-02
- Fixed caret issues from showing on < and > that were inside a parameter string ([gh-1](/../../issues/1))
- Downgraded duplicate namespace error to warning ([gh-6](/../../issues/6))
- Fixed errors showing within comments ([gh-4](/../../issues/4))
- Fixed scan on open to properly check nested items
- Fixed namespace and refid errors not respecting namespaces that are shared across files ([gh-5](/../../issues/5))
- Fixed Ctrl+Click action not working on namespaces that are shared across files ([gh-5](/../../issues/5))
- Fixed mapper name already in use for no_namespace name ([gh-6](/../../issues/6))
- Fixed tags complaining about a missing pair when it was just looking at a subset of the full tag name ([gh-2](/../../issues/2))
- Adjusted types of tags
  - Moved `properties` and `property` to both closing types
  - Added `constructor-arg` to both closing types
  - Added `sqlMap` to normal closing type
- Fixed nested tags throwing missing pair error ([gh-3](/../../issues/3))

## [0.2.1] - 2021-12-29
- Added new features to README.md

## [0.2.0] - 2021-12-29
- Fixed namespaces to refresh on save to get updated namespace details
- Added Ctrl+Hover support to refids (shows definition of the include)
- Added Ctrl+Click to refids (links to definition)

## [0.1.1] - 2021-12-24
- Added icon

## [0.1.0] - 2021-12-24
- Initial release
