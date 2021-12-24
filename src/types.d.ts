export type MybatisNamespace = {
	path: string,
	name: string,
	ids: {
		sql: Array<string>,
		select: Array<string>,
		insert: Array<string>,
		update: Array<string>,
		delete: Array<string>
	}
}

export type MybatisNamespaces = {
	paths: Array<string>,
	names: Array<string>,
	details: Array<MybatisNamespace>
}
