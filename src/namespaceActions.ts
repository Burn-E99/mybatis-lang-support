import * as vscode from 'vscode';
import { lookupCodeBehindRefId } from './extension';

// Namespace definition link provider, creates Ctrl+Click action when clicking refids
export class NamespaceDefinitionsProvider implements vscode.DefinitionProvider {
	public provideDefinition(doc: vscode.TextDocument, pos: vscode.Position): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
		const hoveredWordPos = doc.getWordRangeAtPosition(pos);
		if (hoveredWordPos) {
			// Check if we are hovering a refid
			const beforeHoveredWordPos = doc.getWordRangeAtPosition(new vscode.Position(hoveredWordPos.start.line, (hoveredWordPos.start.character - 2)));
			if (doc.getText(beforeHoveredWordPos).toLowerCase() === 'refid') {
				const hoveredRefId = doc.getText(hoveredWordPos).split('.');
				// Define namespace and Id we will be looking for 
				const hoveredNamespace = hoveredRefId[1] ? hoveredRefId[0] : '';
				const hoveredId = hoveredRefId[1] || hoveredRefId[0];

				// Get code to display
				const link = lookupCodeBehindRefId(hoveredNamespace, hoveredId, doc);

				// Show Definition
				return link ? [link] : null;
			}
		}

		// Not hovering something we need to add a definition to
		return;
	}
}
