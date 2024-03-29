/* eslint-disable @typescript-eslint/naming-convention */
// Issues with left and right carets we want to fix, && turns into & in the solution
export const CARET_ISSUES = [
	{
		NAME: 'mustBeLTGT',
		DESC: '<> cannot be used in mapper files for comparison.',
		PROBLEM: ' <> ',
		SOLUTION1: '&&lt;&&gt;',
		SOLUTION2: '<![CDATA[ <> ]]>',
		FIX1: '&lt;&gt;',
		FIX2: '<![CDATA[ <> ]]>',
		OFFSET: 1,
		SIZE: 2
	}, {
		NAME: 'mustBeLT',
		DESC: '< cannot be used in mapper files for comparison.',
		PROBLEM: ' < ',
		SOLUTION1: '&&lt;',
		SOLUTION2: '<![CDATA[ < ]]>',
		FIX1: '&lt;',
		FIX2: '<![CDATA[ < ]]>',
		OFFSET: 1,
		SIZE: 1
	}, {
		NAME: 'mustBeGT',
		DESC: '> cannot be used in mapper files for comparison.',
		PROBLEM: ' > ',
		SOLUTION1: '&&gt;',
		SOLUTION2: '<![CDATA[ > ]]>',
		FIX1: '&gt;',
		FIX2: '<![CDATA[ > ]]>',
		OFFSET: 1,
		SIZE: 1
	}, {
		NAME: 'mustBeLTEQ',
		DESC: '<= cannot be used in mapper files for comparison.',
		PROBLEM: ' <= ',
		SOLUTION1: '&&lt;=',
		SOLUTION2: '<![CDATA[ <= ]]>',
		FIX1: '&lt;=',
		FIX2: '<![CDATA[ <= ]]>',
		OFFSET: 1,
		SIZE: 2
	}, {
		NAME: 'mustBeGTEQ',
		DESC: '>= cannot be used in mapper files for comparison.',
		PROBLEM: ' >= ',
		SOLUTION1: '&&gt;=',
		SOLUTION2: '<![CDATA[ >= ]]>',
		FIX1: '&gt;=',
		FIX2: '<![CDATA[ >= ]]>',
		OFFSET: 1,
		SIZE: 2
	}, {
		NAME: 'mustBeLTGT',
		DESC: '<> cannot be used in mapper files for comparison.',
		PROBLEM: ' &lt;> ',
		SOLUTION1: '&&lt;&&gt;',
		SOLUTION2: '<![CDATA[ <> ]]>',
		FIX1: '&lt;&gt;',
		FIX2: '<![CDATA[ <> ]]>',
		OFFSET: 1,
		SIZE: 5
	}, {
		NAME: 'mustBeLTGT',
		DESC: '<> cannot be used in mapper files for comparison.',
		PROBLEM: ' <&gt; ',
		SOLUTION1: '&&lt;&&gt;',
		SOLUTION2: '<![CDATA[ <> ]]>',
		FIX1: '&lt;&gt;',
		FIX2: '<![CDATA[ <> ]]>',
		OFFSET: 1,
		SIZE: 5
	}, {
		NAME: 'mustBeAmp',
		DESC: '& cannot be used in mapper files for bitwise operations.',
		PROBLEM: ' & ',
		SOLUTION1: '&&amp;',
		SOLUTION2: '<![CDATA[ && ]]>',
		FIX1: '&amp;',
		FIX2: '<![CDATA[ & ]]>',
		OFFSET: 1,
		SIZE: 1
	}
];

// Any issues surrounding <include refid="namespace.reference"/>
export const REFID_ISSUE = {
	MISSING_ID_NAME: 'refIdMissing',
	MISSING_ID_DESC: (name: string, ref: string) => `The refid "${ref}" does not exist in the namespace "${name}".`,
	MISSING_NAMESPACE_NAME: 'namespaceMissing',
	MISSING_NAMESPACE_DESC: (name: string) => `The namespace "${name}" does not exist.`,
	NO_NAMESPACE_NAME: 'noNamespace',
	NO_NAMESPACE_TEXT: 'no_namespace',
	NO_NAMESPACE_DESC: 'No namespace is provided in this refid, please add one to avoid confusion.',
	MISSING_ID_NO_NAMESPACE_NAME: 'refIdMissingNoNamespace',
	MISSING_ID_NO_NAMESPACE_DESC: (ref: string, name: string) => `The refid "${ref}" does not exist in the namespace of this file, "${name}".`,
	MISSING_ID_NO_NAMESPACE_GLOBAL: (ref: string) => `The refid "${ref}" does not exist in any namespace of this project.`,
	INCLUDE_START: 'refid="',
	INCLUDE_END: '"',
	INCLUDE_OFFSET: 7
};

// Any issues surrounding unclosed xml tags
export const PAIR_ISSUES = {
	SELF_CLOSING: [
		'result', 'id', 'idArg', 'arg', 'cache-ref', 'bind', 'typeAlias', 'setting', 'package', 'typeHandler'
	],
	NORM_CLOSING: [
		'select', 'delete', 'insert', 'update', 'selectKey', 'sql', 'typeAliases', 'constructor', 'discriminator', 'foreach', 'choose', 'when', 'otherwise', 'where', 'trim', 'set',
		'dataSource', 'typeHandlers', 'objectFactory', 'plugins', 'plugin', 'environments', 'environment', 'mappers'
	],
	BOTH_CLOSING: [
		'association', 'collection', 'include', 'case', 'cache', 'databaseIdProvider', 'mapper', 'transactionManager',
		'property', 'properties', 'constructor-arg', 'sqlMap', 'settings', 'if', 'resultMap'
	],
	OPEN: (tag: string) => `<${tag}`,
	NORM_CLOSE: (tag: string) => `</${tag}>`,
	SELF_CLOSE: '/>',
	NAME: (tag: string) => `${tag}MissingClosing`,
	DESC: (closing: string) => `This tag is missing a closing ${closing}.`,
	EXTRA_DESC: 'This closing tag has no opening pair.',
	OFFSET: 1,
	CLOSE_OFFSET: 2
};

// Duplicate namespace issue
export const NAMESPACE_ISSUE = {
	NAME: 'duplicateNamespace',
	DESC: (name: string) => `The namespace "${name}" is already in use in another mapper.`
};

// Duplicate id issues
export const DUPLICATE_ID_ISSUE = {
	NAME: 'duplicateId',
	WARN: (name: string) => `The id "${name}" is already used by a differnt tag, please change one of these to avoid confusion.`,
	DESC: (name: string) => `The id "${name}" is already used by the same tag type in this namespace.`
};
