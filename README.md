# mybatis-lang-support
Mybatis Lang Support adds useful error checking to Mybatis mapper XML files, helping alleviate typos and other common issues.

This extension is intended to be used on ibatis and mybatis projects using `useStatementNamespaces="true"` ([details](http://java.ociweb.com/mark/programming/iBATIS.html#MappedStatements)).  If your project does not use this, or utilizes references without namespaces, you should enable the `legacySupport` setting.

## Features
* Verifies that all `<` and `>` characters are properly encoded, and provides quickfixes when they are not properly encoded
* Verifies that all references exist with valid namespaces, and provides quickfixes when a namespace is missing from the reference
* Verifies that ids are not duplicated
* Verifies that all tags are properly closed
* Provides quick links on `<include refid` tags to quickly jump between the usage and definition
* Shows definition of the `<include refid` when holding `Ctrl` and hovering over a `refid`
* Provides tab completion for `refids`, first suggesting the namespaces, then after pressing `.`, the sql references
  * !! NOTICE !! Tab completions will not work without the following setting set either in your workspace or user settings:
	```
	"editor.quickSuggestions": {
		"strings": true
	}
	```

## Extension Settings
* `mybatis-lang-support.mapperPath`: Name of the folder holding your mapper.xml files. Start with `./` to make relative to this workspace.
* `mybatis-lang-support.mapperTag`: Name of the tag that defines the mappers.
* `mybatis-lang-support.legacySupport`: Enable this setting to support legacy standards.  This setting will remove the namespace requirement for `<include refid=\"\"/>`, allowing ids to be referenced without a namespace.

## Installation
Get it direct from the [Extension Marketplace](https://marketplace.visualstudio.com/items?itemName=ean-milligan.mybatis-lang-support).

## Release Notes
See [CHANGELOG.md](./CHANGELOG.md)

## Problems?
Please raise a descriptive issue on [this GitHub repo](https://github.com/Burn-E99/mybatis-lang-support/issues) containing examples of the problem you are encountering.  The more clear and desciptive the issue, the more likely it will be investigated and fixed quickly.
