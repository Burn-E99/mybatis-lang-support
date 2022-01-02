import * as vscode from 'vscode';
import * as clone from 'clone';
import { MybatisNamespace, MybatisNamespaces } from './types';
import { CARET_ISSUES, REFID_ISSUE, PAIR_ISSUES, NAMESPACE_ISSUE, DUPLICATE_ID_ISSUE } from './issues';
import { getNamespaceFromDoc } from './extension';

const wordEndRegex = /([\s\t\r\n>])/;

// Initialize every mapper file with proper diagnostic details
export const init = async (mapperPath: string, collection: vscode.DiagnosticCollection, mybatisNamespaces: MybatisNamespaces) => {
	// Get items in current folder (starts as mapperPath, but recursively reads deeper)
	const currentFolder = await vscode.workspace.fs.readDirectory(vscode.Uri.file(mapperPath));

	// Check every item in the current folder
	for (const item of currentFolder) {
		const currentPath = `${mapperPath}${item[0]}`;
		if (item[1] === 2) {
			// We found a folder, recusively read deeper
			await init(`${currentPath}/`, collection, mybatisNamespaces);
		} else if (item[1] === 1 && item[0].toLowerCase().endsWith('.xml')) {
			// We found a xml file, parse the namespace and refids out
			update(await vscode.workspace.openTextDocument(currentPath), collection, mapperPath, mybatisNamespaces);
		}
	}
};

// Set diagnostic markers on doc
export const update = (doc: vscode.TextDocument, collection: vscode.DiagnosticCollection, mapperPath: string, mybatisNamespaces: MybatisNamespaces) => {
	if (doc && mapperPath && doc.uri.path.startsWith(mapperPath) && doc.uri.path.toLowerCase().endsWith('.xml')) {
		const issues: Array<vscode.Diagnostic> = [];
		let docText = doc.getText();

		// Ignore comments by removing them from the document (in our local docText only)
		while (docText.indexOf('<!--') >= 0) {
			const startIdx = docText.indexOf('<!--');
			const endIdx = docText.indexOf('-->') + 3;
			
			// Replace comment with whitespace chars
			docText = docText.substring(0, startIdx) + new Array(endIdx - startIdx + 1).join(' ') + docText.substring(endIdx);
		}

		// Make all diagnostic markers for caret issues
		for (const CARET_ISSUE of CARET_ISSUES) {
			let currentOffset = 0;
			while (docText.indexOf(CARET_ISSUE.PROBLEM, currentOffset) >= 0) {
				const currentIdx = docText.indexOf(CARET_ISSUE.PROBLEM, currentOffset);

				// Get current line
				const currentLine = doc.lineAt(doc.positionAt(currentIdx).line).text;

				// Make sure the caret issue is not inside a string (such as inside a test param on an if tag)
				if (currentLine.indexOf('"', currentIdx) === -1 && currentLine.lastIndexOf('"', currentIdx) === -1) {
					issues.push({
						code: CARET_ISSUE.NAME,
						message: CARET_ISSUE.DESC,
						range: new vscode.Range(
							doc.positionAt(currentIdx + CARET_ISSUE.OFFSET),
							doc.positionAt(currentIdx + CARET_ISSUE.OFFSET + CARET_ISSUE.SIZE)
						),
						severity: vscode.DiagnosticSeverity.Error
					});
				}

				// Shift currentIdx to after what we are marking
				currentOffset = currentIdx + CARET_ISSUE.OFFSET + CARET_ISSUE.SIZE;
			}
		}

		// Make all diagnostic markers for missing namespaces and references
		let includeOffset = 0;
		while (docText.indexOf(REFID_ISSUE.INCLUDE_START, includeOffset) >= 0) {
			// Find refid
			const includeStartIdx = docText.indexOf(REFID_ISSUE.INCLUDE_START, includeOffset) + REFID_ISSUE.INCLUDE_OFFSET;
			const includeEndIdx = docText.indexOf(REFID_ISSUE.INCLUDE_END, includeStartIdx);
			const refidText = docText.substring(includeStartIdx, includeEndIdx);
			// Check if a namespace is provided
			if (refidText.includes('.')) {
				// Namespace is provided
				const [namespace, reference] = docText.substring(includeStartIdx, includeEndIdx).split('.');
				// Check for issues
				if (!mybatisNamespaces.names.includes(namespace)) {
					// Namespace missing
					issues.push({
						code: REFID_ISSUE.MISSING_NAMESPACE_NAME,
						message: REFID_ISSUE.MISSING_NAMESPACE_DESC(namespace),
						range: new vscode.Range(
							doc.positionAt(includeStartIdx),
							doc.positionAt(includeEndIdx)
						),
						severity: vscode.DiagnosticSeverity.Error
					});
				} else {
					const mybatisNamespace: MybatisNamespace = clone(mybatisNamespaces.details.filter((mybatisNamespace: MybatisNamespace) => mybatisNamespace.name === namespace)[0]);

					// Merge namespaces of same name into mybatisNamespace
					let detailsOffset = 0;
					while (mybatisNamespaces.names.includes(mybatisNamespace.name, detailsOffset)) {
						const currentDetailsIdx = mybatisNamespaces.names.indexOf(mybatisNamespace.name, detailsOffset);
						if (mybatisNamespaces.paths[currentDetailsIdx] !== mybatisNamespace.path) {
							mybatisNamespace.ids.sql.push(...mybatisNamespaces.details[currentDetailsIdx].ids.sql);
							mybatisNamespace.ids.delete.push(...mybatisNamespaces.details[currentDetailsIdx].ids.delete);
							mybatisNamespace.ids.select.push(...mybatisNamespaces.details[currentDetailsIdx].ids.select);
							mybatisNamespace.ids.insert.push(...mybatisNamespaces.details[currentDetailsIdx].ids.insert);
							mybatisNamespace.ids.update.push(...mybatisNamespaces.details[currentDetailsIdx].ids.update);
						}

						// Shift current offset to not get in infinite loop
						detailsOffset = currentDetailsIdx + 1;
					}

					if (!mybatisNamespace.ids.sql.includes(reference)) {
						// Reference missing
						issues.push({
							code: REFID_ISSUE.MISSING_ID_NAME,
							message: REFID_ISSUE.MISSING_ID_DESC(namespace, reference),
							range: new vscode.Range(
								doc.positionAt(includeStartIdx),
								doc.positionAt(includeEndIdx)
							),
							severity: vscode.DiagnosticSeverity.Error
						});
					}
				}
			} else {
				// No namespace provided, check if refid exists on this file's namespace
				const mybatisNamespace: MybatisNamespace = clone(mybatisNamespaces.details.filter((mybatisNamespace: MybatisNamespace) => mybatisNamespace.path === doc.uri.path)[0]);

				// Merge namespaces of same name into mybatisNamespace
				let detailsOffset = 0;
				while (mybatisNamespaces.names.includes(mybatisNamespace.name, detailsOffset)) {
					const currentDetailsIdx = mybatisNamespaces.names.indexOf(mybatisNamespace.name, detailsOffset);
					if (mybatisNamespaces.paths[currentDetailsIdx] !== mybatisNamespace.path) {
						mybatisNamespace.ids.sql.push(...mybatisNamespaces.details[currentDetailsIdx].ids.sql);
						mybatisNamespace.ids.delete.push(...mybatisNamespaces.details[currentDetailsIdx].ids.delete);
						mybatisNamespace.ids.select.push(...mybatisNamespaces.details[currentDetailsIdx].ids.select);
						mybatisNamespace.ids.insert.push(...mybatisNamespaces.details[currentDetailsIdx].ids.insert);
						mybatisNamespace.ids.update.push(...mybatisNamespaces.details[currentDetailsIdx].ids.update);
					}

					// Shift current offset to not get in infinite loop
					detailsOffset = currentDetailsIdx + 1;
				}

				if (mybatisNamespace.ids.sql.includes(refidText)) {
					// Reference exists, give warning
					issues.push({
						code: REFID_ISSUE.NO_NAMESPACE_NAME,
						message: REFID_ISSUE.NO_NAMESPACE_DESC,
						range: new vscode.Range(
							doc.positionAt(includeStartIdx),
							doc.positionAt(includeEndIdx)
						),
						severity: vscode.DiagnosticSeverity.Warning
					});
				} else {
					// Reference does not exist, error
					issues.push({
						code: REFID_ISSUE.MISSING_ID_NO_NAMESPACE_NAME,
						message: REFID_ISSUE.MISSING_ID_NO_NAMESPACE_DESC(refidText),
						range: new vscode.Range(
							doc.positionAt(includeStartIdx),
							doc.positionAt(includeEndIdx)
						),
						severity: vscode.DiagnosticSeverity.Error
					});
				}
			}

			// Shift offset to get next refid
			includeOffset = includeEndIdx;
		}

		// Make all diagnostic markers for self closing issues
		for (const tag of PAIR_ISSUES.SELF_CLOSING) {
			let currentOffset = 0;
			while (docText.indexOf(PAIR_ISSUES.OPEN(tag), currentOffset) >= 0) {
				// Get index of current tag and see if there is another tag after this
				const openIdx = docText.indexOf(PAIR_ISSUES.OPEN(tag), currentOffset);
				const nextTagIdx = docText.indexOf('<', openIdx + PAIR_ISSUES.OFFSET);
				// Get the closing idx, limited either by where the next tag is or the start of this tag
				let closeIdx;
				if (nextTagIdx === -1) {
					closeIdx = docText.indexOf(PAIR_ISSUES.SELF_CLOSE, openIdx + PAIR_ISSUES.OFFSET);
				} else {
					closeIdx = docText.lastIndexOf(PAIR_ISSUES.SELF_CLOSE, nextTagIdx);
				}
				if ((closeIdx === -1 || closeIdx <= openIdx) && wordEndRegex.test(docText[openIdx + tag.length + PAIR_ISSUES.OFFSET])) {
					// Tag is missing a closing, add error
					issues.push({
						code: PAIR_ISSUES.NAME(tag),
						message: PAIR_ISSUES.DESC(PAIR_ISSUES.SELF_CLOSE),
						range: new vscode.Range(
							doc.positionAt(openIdx + PAIR_ISSUES.OFFSET),
							doc.positionAt(openIdx + PAIR_ISSUES.OFFSET + tag.length)
						),
						severity: vscode.DiagnosticSeverity.Error
					});
				}

				// shift currentOffset to after what we are marking
				currentOffset = openIdx + PAIR_ISSUES.OPEN(tag).length;
			}
		}

		// Make all diagnostic markers for normal closing issues
		for (const tag of PAIR_ISSUES.NORM_CLOSING) {
			let currentOffset = 0;
			let lastCloseIdx = 0;
			// Handle opening without closing
			while (docText.indexOf(PAIR_ISSUES.OPEN(tag), currentOffset) >= 0) {
				// Get index of current tag and see if there is another tag after this
				const openIdx = docText.indexOf(PAIR_ISSUES.OPEN(tag), currentOffset);
				let closeIdx = docText.indexOf(PAIR_ISSUES.NORM_CLOSE(tag), openIdx + PAIR_ISSUES.OFFSET);

				// Only enter if the tag is actually what we are looking for
				if (wordEndRegex.test(docText[openIdx + tag.length + PAIR_ISSUES.OFFSET])) {
					// tagCount will increment when an opening is found and decrement when a closing is found
					// initialized to 1 to include the current openIdx
					let tagCount = 1;
					const nextOpenIdxCheck = docText.indexOf(PAIR_ISSUES.OPEN(tag), openIdx + PAIR_ISSUES.OFFSET);
					let workingIdx = nextOpenIdxCheck;
					let workingCloseIdx = closeIdx;
					// We'll only enter this while loop if there is another opening tag before the closing tag
					if (nextOpenIdxCheck < workingCloseIdx) {
						while (workingIdx !== -1 && tagCount !== 0) {
							const nextOpenIdx = docText.indexOf(PAIR_ISSUES.OPEN(tag), workingIdx);
							const nextCloseIdx = docText.indexOf(PAIR_ISSUES.NORM_CLOSE(tag), workingIdx + PAIR_ISSUES.OFFSET);
							
							// Determine which tag we are looking at
							if (nextOpenIdx < nextCloseIdx && nextOpenIdx !== -1) {
								// The next tag in the document is an opening tag, increment
								tagCount++;
								workingIdx = nextOpenIdx + PAIR_ISSUES.OFFSET;
							} else {
								// The next tag in the document is a closing tag, decrement
								tagCount--;
								workingIdx = nextCloseIdx + PAIR_ISSUES.OFFSET;
							}
							
							// update our closing idx
							workingCloseIdx = nextCloseIdx;

							// Exit the loop if we run out of tags or our workingIdx moves to before our start point
							if ((nextOpenIdx === -1 && nextCloseIdx === -1) || workingIdx < nextOpenIdxCheck) {
								break;
							}
						}

						// Update the closeIdx
						closeIdx = workingCloseIdx;
					}

					if (closeIdx === -1) {
						// Tag is missing a closing, add error
						issues.push({
							code: PAIR_ISSUES.NAME(tag),
							message: PAIR_ISSUES.DESC(PAIR_ISSUES.NORM_CLOSE(tag)),
							range: new vscode.Range(
								doc.positionAt(openIdx + PAIR_ISSUES.OFFSET),
								doc.positionAt(openIdx + PAIR_ISSUES.OFFSET + tag.length)
							),
							severity: vscode.DiagnosticSeverity.Error
						});
					}
				}

				// shift currentOffset to after what we are marking
				currentOffset = openIdx + PAIR_ISSUES.OPEN(tag).length;
				if (lastCloseIdx > closeIdx + PAIR_ISSUES.NORM_CLOSE(tag).length) {
					lastCloseIdx = lastCloseIdx;
				} else {
					lastCloseIdx = closeIdx + PAIR_ISSUES.NORM_CLOSE(tag).length;
				}
			}

			// Handle closing without opening
			if (lastCloseIdx >= currentOffset) {
				while (docText.indexOf(PAIR_ISSUES.NORM_CLOSE(tag), lastCloseIdx) >= 0) {
					// Get index of current tag and see if there is another tag after this
					const openIdx = docText.indexOf(PAIR_ISSUES.NORM_CLOSE(tag), lastCloseIdx);
					if (openIdx !== -1 && wordEndRegex.test(docText[openIdx + tag.length + PAIR_ISSUES.CLOSE_OFFSET])) {
						// Tag is missing a opening, add error
						issues.push({
							code: PAIR_ISSUES.NAME(tag),
							message: PAIR_ISSUES.EXTRA_DESC,
							range: new vscode.Range(
								doc.positionAt(openIdx + PAIR_ISSUES.CLOSE_OFFSET),
								doc.positionAt(openIdx + PAIR_ISSUES.CLOSE_OFFSET + tag.length)
							),
							severity: vscode.DiagnosticSeverity.Error
						});
					}

					// shift currentOffset to after what we are marking
					lastCloseIdx = openIdx + PAIR_ISSUES.NORM_CLOSE(tag).length;
				}
			}
		}

		// Make all diagnostic markers for tags that can close either way
		for (const tag of PAIR_ISSUES.BOTH_CLOSING) {
			let currentOffset = 0;
			let lastCloseIdx = 0;
			while (docText.indexOf(PAIR_ISSUES.OPEN(tag), currentOffset) >= 0) {
				// Get index of current tag and see if there is another tag after this
				const openIdx = docText.indexOf(PAIR_ISSUES.OPEN(tag), currentOffset);
				let closeIdx = docText.indexOf(PAIR_ISSUES.NORM_CLOSE(tag), openIdx + PAIR_ISSUES.OFFSET);

				if (wordEndRegex.test(docText[openIdx + tag.length + PAIR_ISSUES.OFFSET])) {
					if (closeIdx === -1) {
						const nextTagIdx = docText.indexOf('<', openIdx + PAIR_ISSUES.OFFSET);
						// Get the closing idx, limited either by where the next tag is or the start of this tag
						if (nextTagIdx === -1) {
							closeIdx = docText.indexOf(PAIR_ISSUES.SELF_CLOSE, openIdx + PAIR_ISSUES.OFFSET);
						} else {
							closeIdx = docText.lastIndexOf(PAIR_ISSUES.SELF_CLOSE, nextTagIdx);
						}
					} else {
						// tagCount will increment when an opening is found and decrement when a closing is found
						// initialized to 1 to include the current openIdx
						let tagCount = 1;
						const nextOpenIdxCheck = docText.indexOf(PAIR_ISSUES.OPEN(tag), openIdx + PAIR_ISSUES.OFFSET);
						let workingIdx = nextOpenIdxCheck;
						let workingCloseIdx = closeIdx;
						// We'll only enter this while loop if there is another opening tag before the closing tag
						if (nextOpenIdxCheck < workingCloseIdx) {
							while (workingIdx !== -1 && tagCount !== 0) {
								const nextOpenIdx = docText.indexOf(PAIR_ISSUES.OPEN(tag), workingIdx);
								const nextCloseIdx = docText.indexOf(PAIR_ISSUES.NORM_CLOSE(tag), workingIdx + PAIR_ISSUES.OFFSET);
								
								// Determine which tag we are looking at
								if (nextOpenIdx < nextCloseIdx && nextOpenIdx !== -1) {
									// The next tag in the document is an opening tag, increment
									tagCount++;
									workingIdx = nextOpenIdx + PAIR_ISSUES.OFFSET;
								} else {
									// The next tag in the document is a closing tag, decrement
									tagCount--;
									workingIdx = nextCloseIdx + PAIR_ISSUES.OFFSET;
								}
								
								// update our closing idx
								workingCloseIdx = nextCloseIdx;

								// Exit the loop if we run out of tags or our workingIdx moves to before our start point
								if ((nextOpenIdx === -1 && nextCloseIdx === -1) || workingIdx < nextOpenIdxCheck) {
									break;
								}
							}

							// Update the closeIdx
							closeIdx = workingCloseIdx;
						}
					}

					if ((closeIdx === -1 || closeIdx <= openIdx)) {
						// Tag is missing a closing, add error
						issues.push({
							code: PAIR_ISSUES.NAME(tag),
							message: PAIR_ISSUES.DESC(`${PAIR_ISSUES.NORM_CLOSE(tag)} or ${PAIR_ISSUES.SELF_CLOSE}`),
							range: new vscode.Range(
								doc.positionAt(openIdx + PAIR_ISSUES.OFFSET),
								doc.positionAt(openIdx + PAIR_ISSUES.OFFSET + tag.length)
							),
							severity: vscode.DiagnosticSeverity.Error
						});
					}
				}

				// shift currentOffset to after what we are marking
				currentOffset = openIdx + PAIR_ISSUES.OPEN(tag).length;
				if (lastCloseIdx > closeIdx + PAIR_ISSUES.NORM_CLOSE(tag).length) {
					lastCloseIdx = lastCloseIdx;
				} else {
					lastCloseIdx = closeIdx + PAIR_ISSUES.NORM_CLOSE(tag).length;
				}
			}

			// Handle closing without opening
			if (lastCloseIdx >= currentOffset) {
				while (docText.indexOf(PAIR_ISSUES.NORM_CLOSE(tag), lastCloseIdx) >= 0) {
					// Get index of current tag and see if there is another tag after this
					const openIdx = docText.indexOf(PAIR_ISSUES.NORM_CLOSE(tag), lastCloseIdx);
					if (openIdx !== -1 && wordEndRegex.test(docText[openIdx + tag.length + PAIR_ISSUES.CLOSE_OFFSET])) {
						// Tag is missing a opening, add error
						issues.push({
							code: PAIR_ISSUES.NAME(tag),
							message: PAIR_ISSUES.EXTRA_DESC,
							range: new vscode.Range(
								doc.positionAt(openIdx + PAIR_ISSUES.CLOSE_OFFSET),
								doc.positionAt(openIdx + PAIR_ISSUES.CLOSE_OFFSET + tag.length)
							),
							severity: vscode.DiagnosticSeverity.Error
						});
					}

					// shift currentOffset to after what we are marking
					lastCloseIdx = openIdx + PAIR_ISSUES.NORM_CLOSE(tag).length;
				}
			}
		}

		// Make all diagnostic markers for duplicate namespaces
		const myDetails: MybatisNamespace = clone(mybatisNamespaces.details.filter((mybatisNamespace: MybatisNamespace) => mybatisNamespace.path === doc.uri.path)[0]);

		// Merge namespaces of same name into myDetails
		let detailsOffset = 0;
		while (mybatisNamespaces.names.includes(myDetails.name, detailsOffset)) {
			const currentDetailsIdx = mybatisNamespaces.names.indexOf(myDetails.name, detailsOffset);
			if (mybatisNamespaces.paths[currentDetailsIdx] !== myDetails.path) {
				myDetails.ids.sql.push(...mybatisNamespaces.details[currentDetailsIdx].ids.sql);
				myDetails.ids.delete.push(...mybatisNamespaces.details[currentDetailsIdx].ids.delete);
				myDetails.ids.select.push(...mybatisNamespaces.details[currentDetailsIdx].ids.select);
				myDetails.ids.insert.push(...mybatisNamespaces.details[currentDetailsIdx].ids.insert);
				myDetails.ids.update.push(...mybatisNamespaces.details[currentDetailsIdx].ids.update);
			}

			// Shift current offset to not get in infinite loop
			detailsOffset = currentDetailsIdx + 1;
		}

		// Get list of duplicate namespaces
		const duplicateNamespaces = mybatisNamespaces.names.filter((name: string, idx: number) => mybatisNamespaces.names.indexOf(name) !== idx);
		if (duplicateNamespaces.includes(myDetails.name) && myDetails.name !== 'no_namespace') {
			// Our namespace is duplicated, show error
			issues.push({
				code: NAMESPACE_ISSUE.NAME,
				message: NAMESPACE_ISSUE.DESC(myDetails.name),
				range: new vscode.Range(
					doc.positionAt(docText.indexOf('namespace="') + 11),
					doc.positionAt(docText.indexOf('namespace="') + 11 + myDetails.name.length)
				),
				severity: vscode.DiagnosticSeverity.Warning
			});
		}

		// Set up arrays for duplicate ids, new Set is used to remove duplicates from within certain sections to prevent doubled up warnings/errors
		const allIds = [...new Set(myDetails.ids.sql), ...new Set(myDetails.ids.insert), ...new Set(myDetails.ids.update), ...new Set(myDetails.ids.delete), ...new Set(myDetails.ids.select)];
		const duplicateIds = {
			all: [...new Set(allIds.filter((name: string, idx: number) => allIds.indexOf(name) !== idx))],
			sql: [...new Set(myDetails.ids.sql.filter((name: string, idx: number) => myDetails.ids.sql.indexOf(name) !== idx))],
			insert: [...new Set(myDetails.ids.insert.filter((name: string, idx: number) => myDetails.ids.insert.indexOf(name) !== idx))],
			update: [...new Set(myDetails.ids.update.filter((name: string, idx: number) => myDetails.ids.update.indexOf(name) !== idx))],
			delete: [...new Set(myDetails.ids.delete.filter((name: string, idx: number) => myDetails.ids.delete.indexOf(name) !== idx))],
			select: [...new Set(myDetails.ids.select.filter((name: string, idx: number) => myDetails.ids.select.indexOf(name) !== idx))]
		};
		
		// Warn user of ids used between different types
		for (const duplicateId of duplicateIds.all) {
			issues.push({
				code: DUPLICATE_ID_ISSUE.NAME,
				message: DUPLICATE_ID_ISSUE.WARN(duplicateId),
				range: new vscode.Range(
					doc.positionAt(docText.indexOf(` id="${duplicateId}"`) + 5),
					doc.positionAt(docText.indexOf(` id="${duplicateId}"`) + 5 + duplicateId.length)
				),
				severity: vscode.DiagnosticSeverity.Warning
			});
		}

		// Show errors on duplicate ids within one type
		for (const type of Object.keys(myDetails.ids)) {
			if (type === 'sql' || type === 'insert' || type === 'update' || type === 'delete' || type === 'select') {
				for (const duplicateId of duplicateIds[type]) {
					issues.push({
						code: DUPLICATE_ID_ISSUE.NAME,
						message: DUPLICATE_ID_ISSUE.DESC(duplicateId),
						range: new vscode.Range(
							doc.positionAt(docText.indexOf(` id="${duplicateId}"`, docText.indexOf(PAIR_ISSUES.OPEN(type))) + 5),
							doc.positionAt(docText.indexOf(` id="${duplicateId}"`, docText.indexOf(PAIR_ISSUES.OPEN(type))) + 5 + duplicateId.length)
						),
						severity: vscode.DiagnosticSeverity.Error
					});
				}
			}
		}

		// Set diagnostic markers for file
		collection.set(doc.uri, issues);
	}
};

// Quick Fixes for caret issues
export class FixCarets implements vscode.CodeActionProvider {
	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	public provideCodeActions(doc: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext): vscode.CodeAction[] {
		// Map correct fix to correct issue
		return context.diagnostics
			.filter(diagnostic => CARET_ISSUES.some(caretIssue => caretIssue.NAME === diagnostic.code))
			.map(diagnostic => this.createCommandCodeAction(doc, range, diagnostic));
	}

	private createCommandCodeAction(doc: vscode.TextDocument, range: vscode.Range, diagnostic: vscode.Diagnostic): vscode.CodeAction {
		// Get details on the current issue
		const DIAG = CARET_ISSUES.filter(caretIssue => caretIssue.NAME === diagnostic.code)[0];
		// Set up the fix
		const fix = new vscode.CodeAction(`Convert to ${DIAG.SOLUTION}`, vscode.CodeActionKind.QuickFix);
		fix.edit = new vscode.WorkspaceEdit();
		// Do the fix
		fix.edit.replace(doc.uri, new vscode.Range(range.start, range.start.translate(0, DIAG.SIZE)), DIAG.FIX);
		return fix;
	}
}

// Quick fixes for missing namespace issues
export class FixMissingNamespaces implements vscode.CodeActionProvider {
	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	public provideCodeActions(doc: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext): vscode.CodeAction[] {
		// Map correct fix to correct issue
		return context.diagnostics
			.filter(diagnostic => REFID_ISSUE.NO_NAMESPACE_NAME === diagnostic.code)
			.map(() => this.createCommandCodeAction(doc, range));
	}

	private createCommandCodeAction(doc: vscode.TextDocument, range: vscode.Range): vscode.CodeAction {
		const namespace = getNamespaceFromDoc(doc);
		const replaceStr = `${namespace}.${doc.getText(range)}`;
		// Set up the fix
		const fix = new vscode.CodeAction(`Prepend ${namespace} to this refid`, vscode.CodeActionKind.QuickFix);
		fix.edit = new vscode.WorkspaceEdit();
		// Do the fix
		fix.edit.replace(doc.uri, new vscode.Range(range.start, range.end), replaceStr);
		return fix;
	}
}
