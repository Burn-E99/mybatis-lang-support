import * as vscode from 'vscode';
import { REFID_ISSUE } from './issues';
import { MybatisNamespace, TagDetails } from './types';

// Parses the namespace and ids out of the given xml file
const parseNamespaces = (doc: vscode.TextDocument, mapperTag: string): MybatisNamespace => {
	const names: MybatisNamespace = {
		path: doc.uri.path,
		name: REFID_ISSUE.NO_NAMESPACE_TEXT,
		ids: {
			sql: [],
			select: [],
			insert: [],
			update: [],
			delete: []
		}
	};

	let docText = doc.getText();

	while (docText.indexOf('<!--') >= 0) {
		const startIdx = docText.indexOf('<!--');
		const endIdx = docText.indexOf('-->') + 3;
		
		// Replace comment with whitespace chars
		docText = docText.substring(0, startIdx) + new Array(endIdx - startIdx + 1).join(' ') + docText.substring(endIdx);
	}

	// Get file contents we care about
	const startPos = doc.positionAt(docText.indexOf(`<${mapperTag} `));
	const endIdx = docText.indexOf(`</${mapperTag}>`);
	if (endIdx === -1) {
		return names;
	}
	const endPos = doc.positionAt(endIdx);
	const mapperText = docText.substring(doc.offsetAt(startPos), doc.offsetAt(endPos));

	// Get namespace name
	const nameStartIdx = mapperText.indexOf(' namespace="') + 12;
	const nameEndIdx = mapperText.indexOf('"', nameStartIdx);
	names.name = mapperText.substring(nameStartIdx, nameEndIdx);

	// Get available refs (anything defined as <something id=""> is a ref since you don't call them directly from mybatis)
	let done = false;
	let refSearchStartIdx = nameEndIdx;
	while (!done) {
		// See if there is another <something id=" in this file
		let refNameStartIdx = mapperText.indexOf(' id="', refSearchStartIdx);
		if (refNameStartIdx === -1) {
			done = true;
			break;
		} else {
			// Shift by 5 to ignore the opening "
			refNameStartIdx += 5;
		}
		// Get refName
		const refNameEndIdx = mapperText.indexOf('"', refNameStartIdx);
		const refName = mapperText.substring(refNameStartIdx, refNameEndIdx);

		// See if we have a databaseId on the tag
		const refTypeStartIdx = mapperText.lastIndexOf('<', refNameStartIdx) + 1;
		const refTagCloseIdx = mapperText.indexOf('>', refNameStartIdx);
		let nextDatabaseIdIdx = mapperText.indexOf('databaseId="', refTypeStartIdx);
		
		// Get the databaseIdName
		let databaseIdName = '';
		if (nextDatabaseIdIdx !== -1 && nextDatabaseIdIdx > refTypeStartIdx && nextDatabaseIdIdx < refTagCloseIdx) {
			// Shift nextDatabaseIdIdx by 12 to get after the "
			nextDatabaseIdIdx += 12;
			const databaseIdEndIdx = mapperText.indexOf('"', nextDatabaseIdIdx);
			databaseIdName = mapperText.substring(nextDatabaseIdIdx, databaseIdEndIdx);
		}

		// Now get refType
		const refTypeEndIdx = mapperText.indexOf(' ', refTypeStartIdx);
		const refType = mapperText.substring(refTypeStartIdx, refTypeEndIdx).toLowerCase();

		const tagDetails: TagDetails = {
			id: refName,
			databaseId: databaseIdName
		};

		// Save the refType if we care about it
		switch (refType) {
			case 'sql':
			case 'select':
			case 'insert':
			case 'update':
			case 'delete':
				names.ids[refType].push(tagDetails);
				break;
			default:
				break;
		}
	
		// Move search idx to not repeat refs
		refSearchStartIdx = refNameEndIdx;
	}

	return names;
};

// Read all xml files in the mapperPath
export const readMapperPath = async (mapperPath: string, mapperTag: string): Promise<Array<MybatisNamespace>> => {
	const spaces: Array<MybatisNamespace> = [];

	// Get items in current folder (starts as mapperPath, but recursively reads deeper)
	const currentFolder = await vscode.workspace.fs.readDirectory(vscode.Uri.file(mapperPath));

	// Check every item in the current folder
	for (const item of currentFolder) {
		const currentPath = `${mapperPath}${item[0]}`;
		if (item[1] === 2) {
			// We found a folder, recusively read deeper
			spaces.push(...(await readMapperPath(`${currentPath}/`, mapperTag)));
		} else if (item[1] === 1 && item[0].toLowerCase().endsWith('.xml')) {
			// We found a xml file, parse the namespace and refids out
			spaces.push(parseNamespaces(await vscode.workspace.openTextDocument(currentPath), mapperTag));
		}
	}

	return spaces;
};
