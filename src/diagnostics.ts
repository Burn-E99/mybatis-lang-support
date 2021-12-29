import * as vscode from 'vscode';
import { MybatisNamespace, MybatisNamespaces } from './types';
import { CARET_ISSUES, REFID_ISSUE, PAIR_ISSUES, NAMESPACE_ISSUE, DUPLICATE_ID_ISSUE } from './issues';

// Initialize every mapper file with proper diagnostic details
export const init = async (mapperPath: string, collection: vscode.DiagnosticCollection, mybatisNamespaces: MybatisNamespaces) => {
	// Get items in current folder (starts as mapperPath, but recursively reads deeper)
	const currentFolder = await vscode.workspace.fs.readDirectory(vscode.Uri.file(mapperPath));

	// Check every item in the current folder
	for (const item of currentFolder) {
		const currentPath = `${mapperPath}/${item[0]}`;
		if (item[1] === 2) {
			// We found a folder, recusively read deeper
			await init(currentPath, collection, mybatisNamespaces);
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

		// Make all diagnostic markers for caret issues
		for (const CARET_ISSUE of CARET_ISSUES) {
			let currentOffset = 0;
			while (doc.getText().indexOf(CARET_ISSUE.PROBLEM, currentOffset) >= 0) {
				const currentIdx = doc.getText().indexOf(CARET_ISSUE.PROBLEM, currentOffset);

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
		while (doc.getText().indexOf(REFID_ISSUE.INCLUDE_START, includeOffset) >= 0) {
			// Find refid
			const includeStartIdx = doc.getText().indexOf(REFID_ISSUE.INCLUDE_START, includeOffset) + REFID_ISSUE.INCLUDE_OFFSET;
			const includeEndIdx = doc.getText().indexOf(REFID_ISSUE.INCLUDE_END, includeStartIdx);
			const refidText = doc.getText().substring(includeStartIdx, includeEndIdx);
			// Check if a namespace is provided
			if (refidText.includes('.')) {
				// Namespace is provided
				const [namespace, reference] = doc.getText().substring(includeStartIdx, includeEndIdx).split('.');
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
					const mybatisNamespace: MybatisNamespace = mybatisNamespaces.details.filter((mybatisNamespace: MybatisNamespace) => mybatisNamespace.name === namespace)[0];
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
				const mybatisNamespace: MybatisNamespace = mybatisNamespaces.details.filter((mybatisNamespace: MybatisNamespace) => mybatisNamespace.path === doc.uri.path)[0];
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
			while (doc.getText().indexOf(PAIR_ISSUES.OPEN(tag), currentOffset) >= 0) {
				// Get index of current tag and see if there is another tag after this
				const openIdx = doc.getText().indexOf(PAIR_ISSUES.OPEN(tag), currentOffset);
				const nextTagIdx = doc.getText().indexOf('<', openIdx + PAIR_ISSUES.OFFSET);
				// Get the closing idx, limited either by where the next tag is or the start of this tag
				let closeIdx;
				if (nextTagIdx === -1) {
					closeIdx = doc.getText().indexOf(PAIR_ISSUES.SELF_CLOSE, openIdx + PAIR_ISSUES.OFFSET);
				} else {
					closeIdx = doc.getText().lastIndexOf(PAIR_ISSUES.SELF_CLOSE, nextTagIdx);
				}
				if (closeIdx === -1 || closeIdx <= openIdx) {
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
			while (doc.getText().indexOf(PAIR_ISSUES.OPEN(tag), currentOffset) >= 0) {
				// Get index of current tag and see if there is another tag after this
				const openIdx = doc.getText().indexOf(PAIR_ISSUES.OPEN(tag), currentOffset);
				const closeIdx = doc.getText().indexOf(PAIR_ISSUES.NORM_CLOSE(tag), openIdx + PAIR_ISSUES.OFFSET);
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

				// shift currentOffset to after what we are marking
				currentOffset = openIdx + PAIR_ISSUES.OPEN(tag).length;
				lastCloseIdx = closeIdx + PAIR_ISSUES.NORM_CLOSE(tag).length;
			}

			// Handle closing without opening
			if (lastCloseIdx >= currentOffset) {
				while (doc.getText().indexOf(PAIR_ISSUES.NORM_CLOSE(tag), lastCloseIdx) >= 0) {
					// Get index of current tag and see if there is another tag after this
					const openIdx = doc.getText().indexOf(PAIR_ISSUES.NORM_CLOSE(tag), lastCloseIdx);
					if (openIdx !== -1) {
						// Tag is missing a closing, add error
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
			while (doc.getText().indexOf(PAIR_ISSUES.OPEN(tag), currentOffset) >= 0) {
				// Get index of current tag and see if there is another tag after this
				const openIdx = doc.getText().indexOf(PAIR_ISSUES.OPEN(tag), currentOffset);
				let closeIdx = doc.getText().indexOf(PAIR_ISSUES.NORM_CLOSE(tag), openIdx + PAIR_ISSUES.OFFSET);
				if (closeIdx === -1) {
					const nextTagIdx = doc.getText().indexOf('<', openIdx + PAIR_ISSUES.OFFSET);
					// Get the closing idx, limited either by where the next tag is or the start of this tag
					if (nextTagIdx === -1) {
						closeIdx = doc.getText().indexOf(PAIR_ISSUES.SELF_CLOSE, openIdx + PAIR_ISSUES.OFFSET);
					} else {
						closeIdx = doc.getText().lastIndexOf(PAIR_ISSUES.SELF_CLOSE, nextTagIdx);
					}
				}
				if (closeIdx === -1 || closeIdx <= openIdx) {
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

				// shift currentOffset to after what we are marking
				currentOffset = openIdx + PAIR_ISSUES.OPEN(tag).length;
				lastCloseIdx = closeIdx + PAIR_ISSUES.NORM_CLOSE(tag).length;
			}

			// Handle closing without opening
			if (lastCloseIdx >= currentOffset) {
				while (doc.getText().indexOf(PAIR_ISSUES.NORM_CLOSE(tag), lastCloseIdx) >= 0) {
					// Get index of current tag and see if there is another tag after this
					const openIdx = doc.getText().indexOf(PAIR_ISSUES.NORM_CLOSE(tag), lastCloseIdx);
					if (openIdx !== -1) {
						// Tag is missing a closing, add error
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
		const myDetails: MybatisNamespace = mybatisNamespaces.details.filter((mybatisNamespace: MybatisNamespace) => mybatisNamespace.path === doc.uri.path)[0];
		const duplicateNamespaces = mybatisNamespaces.names.filter((name: string, idx: number) => mybatisNamespaces.names.indexOf(name) !== idx);
		if (duplicateNamespaces.includes(myDetails.name)) {
			// Our namespace is duplicated, show error
			issues.push({
				code: NAMESPACE_ISSUE.NAME,
				message: NAMESPACE_ISSUE.DESC(myDetails.name),
				range: new vscode.Range(
					doc.positionAt(doc.getText().indexOf('namespace="') + 11),
					doc.positionAt(doc.getText().indexOf('namespace="') + 11 + myDetails.name.length)
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
					doc.positionAt(doc.getText().indexOf(`id="${duplicateId}"`) + 4),
					doc.positionAt(doc.getText().indexOf(`id="${duplicateId}"`) + 4 + duplicateId.length)
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
							doc.positionAt(doc.getText().indexOf(`id="${duplicateId}"`, doc.getText().indexOf(PAIR_ISSUES.OPEN(type))) + 4),
							doc.positionAt(doc.getText().indexOf(`id="${duplicateId}"`, doc.getText().indexOf(PAIR_ISSUES.OPEN(type))) + 4 + duplicateId.length)
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
