# mybatis-lang-support
Mybatis Lang Support adds useful error checking to Mybatis mapper XML files, helping alleviate typos and other common issues.

## Features
* Verifies that all `<` and `>` characters are properly encoded
* Verifies that all references exist
* Verifies that ids are not duplicated
* Verifies that all tags are properly closed

## Extension Settings
* `mybatis-lang-support.mapperPath`: Name of the folder holding your mapper.xml files. Start with `./` to make relative to this workspace.

## Release Notes
See [CHANGELOG.md](./CHANGELOG.md)
