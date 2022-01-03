/* eslint-disable @typescript-eslint/naming-convention */
// Issues with left and right carets we want to fix, && turns into & in the solution
export const CARET_ISSUES = [
	{
		NAME: 'mustBeLTGT',
		DESC: '<> cannot be used in mapper files for comparison.',
		PROBLEM: ' <> ',
		SOLUTION: '&&lt;&&gt;',
		FIX: '&lt;&gt;',
		OFFSET: 1,
		SIZE: 2
	}, {
		NAME: 'mustBeLT',
		DESC: '< cannot be used in mapper files for comparison.',
		PROBLEM: ' < ',
		SOLUTION: '&&lt;',
		FIX: '&lt;',
		OFFSET: 1,
		SIZE: 1
	}, {
		NAME: 'mustBeGT',
		DESC: '> cannot be used in mapper files for comparison.',
		PROBLEM: ' > ',
		SOLUTION: '&&gt;',
		FIX: '&gt;',
		OFFSET: 1,
		SIZE: 1
	}, {
		NAME: 'mustBeLTEQ',
		DESC: '<= cannot be used in mapper files for comparison.',
		PROBLEM: ' <= ',
		SOLUTION: '&&lt;=',
		FIX: '&lt;=',
		OFFSET: 1,
		SIZE: 2
	}, {
		NAME: 'mustBeGTEQ',
		DESC: '>= cannot be used in mapper files for comparison.',
		PROBLEM: ' >= ',
		SOLUTION: '&&gt;=',
		FIX: '&gt;=',
		OFFSET: 1,
		SIZE: 2
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
	MISSING_ID_NO_NAMESPACE_DESC: (ref: string) => `The refid "${ref}" does not exist in this file's namespace.`,
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
		'select', 'delete', 'insert', 'update', 'selectKey', 'sql', 'resultMap', 'typeAliases', 'constructor', 'discriminator', 'if', 'foreach', 'choose', 'when', 'otherwise', 'where', 'trim', 'set',
		'settings', 'dataSource', 'typeHandlers', 'objectFactory', 'plugins', 'plugin', 'environments', 'environment', 'mappers', 'sqlMap'
	],
	BOTH_CLOSING: [
		'association', 'collection', 'include', 'case', 'cache', 'databaseIdProvider', 'mapper', 'transactionManager', 'property', 'properties', 'constructor-arg'
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
