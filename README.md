# mybatis-lang-support
Mybatis Lang Support adds useful error checking to Mybatis mapper XML files, helping alleviate typos and other common issues.

## Features
* Verifies that all `<` and `>` characters are properly encoded
* Verifies that all references exist
* Verifies that ids are not duplicated
* Verifies that all tags are properly closed
* Provides quick links on `<include refid` tags to quickly jump between the usage and definition
* Shows definition of the `<include refid` when holding `Ctrl` and hovering over a `refid`

## Extension Settings
* `mybatis-lang-support.mapperPath`: Name of the folder holding your mapper.xml files. Start with `./` to make relative to this workspace.

## Installation
Get it direct from the [Extension Marketplace](https://marketplace.visualstudio.com/items?itemName=ean-milligan.mybatis-lang-support).

## Release Notes
See [CHANGELOG.md](./CHANGELOG.md)

## Problems?
Please raise a descriptive issue on [this GitHub repo](https://github.com/Burn-E99/mybatis-lang-support/issues) containing examples of the problem you are encountering.  The more clear and desciptive the issue, the more likely it will be investigated and fixed quickly.
