import type { TextDocument } from 'vscode';

export type TagDetails = {
	id: string,
	databaseId: string
}

export type MybatisNamespace = {
	path: string,
	name: string,
	ids: {
		sql: Array<TagDetails>,
		select: Array<TagDetails>,
		insert: Array<TagDetails>,
		update: Array<TagDetails>,
		delete: Array<TagDetails>
	}
}

export type MybatisNamespaces = {
	paths: Array<string>,
	names: Array<string>,
	docs: Array<TextDocument>,
	details: Array<MybatisNamespace>
}
