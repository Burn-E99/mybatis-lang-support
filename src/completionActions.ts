import * as vscode from 'vscode';
import { getUniqueNamespaces, getUniqueSqlIdsInNamespace } from './extension';

export const namespaceTriggerChar = '"';
export const referenceTriggerChar = '.';
const refidStr = 'refid="';

// refid namespace completion provider
export class RefIdNamespaceCompletionProvider implements vscode.CompletionItemProvider {
	provideCompletionItems(doc: vscode.TextDocument, position: vscode.Position) {
		const currentLine = doc.lineAt(position).text;
		// Verify we are on a line and character we want completion provided to
		if (
			currentLine.includes(refidStr) &&
			doc.getText(new vscode.Range(position.translate(0, -1), position)) === namespaceTriggerChar &&
			(doc.offsetAt(new vscode.Position(position.line, 0)) + currentLine.indexOf(refidStr) + refidStr.length) === doc.offsetAt(position)
		) {
			const completions: Array<vscode.CompletionItem> = [];
			const namespaces: Array<string> = getUniqueNamespaces();
			// Create list of completionItems from list of namespaces
			for (const namespace of namespaces) {
				const completionItem = new vscode.CompletionItem(namespace);
				completionItem.commitCharacters = [referenceTriggerChar];
				completionItem.kind = vscode.CompletionItemKind.Module;
				completionItem.detail = 'mybatis-lang-support';
				
				completions.push(completionItem);
			}

			// Return list for vscode to push to the user
			return new vscode.CompletionList(completions);
		}

		// Not on a line/character we want to provide completion to
		return;
	}
}

// refid sqlid/reference completion provider
export class RefIdReferemceCompletionProvider implements vscode.CompletionItemProvider {
	provideCompletionItems(doc: vscode.TextDocument, position: vscode.Position) {
		const currentLine = doc.lineAt(position).text;
		// Verify we are on a line and character we want completion provided to
		if (
			currentLine.includes(refidStr) &&
			doc.getText(new vscode.Range(position.translate(0, -1), position)) === referenceTriggerChar &&
			(doc.offsetAt(new vscode.Position(position.line, 0)) + currentLine.indexOf(referenceTriggerChar) + 1) === doc.offsetAt(position)
		) {
			const completions: Array<vscode.CompletionItem> = [];
			const namespace = currentLine.substring((currentLine.indexOf(refidStr) + refidStr.length), currentLine.indexOf(referenceTriggerChar));
			const ids: Array<string> = getUniqueSqlIdsInNamespace(namespace);
			// Create list of completionItems from list of ids
			for (const id of ids) {
				const completionItem = new vscode.CompletionItem(id);
				completionItem.kind = vscode.CompletionItemKind.Reference;
				completionItem.range = new vscode.Range(position, position);
				completionItem.detail = 'mybatis-lang-support';

				completions.push(completionItem);
			}

			// Return list for vscode to push to the user
			return new vscode.CompletionList(completions);
		}

		// Not on a line/character we want to provide completion to
		return;
	}
}
