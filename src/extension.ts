import * as vscode from 'vscode';
import { MybatisNamespaces } from './types';
import * as diagnostics from './diagnostics';
import * as namespaceActions from './namespaceActions';
import * as parser from './parsers';
import * as utils from './utils';

// Init "global" vars
let mapperPath: string;
const mybatisNamespaces: MybatisNamespaces = {
	paths: [],
	names: [],
	docs: [],
	details: []
};

export async function activate(context: vscode.ExtensionContext) {
	// Initialize mapperPath
	mapperPath = await utils.getMapperPath(false);
	// Initialize mapperSpaces
	const mapperSpaces = await parser.readMapperPath(mapperPath);
	// Create collection for setting error markings in files
	const collection = vscode.languages.createDiagnosticCollection('mybatis-lang-support');

	// Save initial namespaces for this project
	for (const mapperSpace of mapperSpaces) {
		mybatisNamespaces.names.push(mapperSpace.name);
		mybatisNamespaces.paths.push(mapperSpace.path);
		mybatisNamespaces.docs.push(await vscode.workspace.openTextDocument(mapperSpace.path));
		mybatisNamespaces.details.push(mapperSpace);
	}

	// Set settings watcher up
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(async () => {
		mapperPath = await utils.getMapperPath(true);
	}));

	// Scan initial document on open
	if (vscode.window.activeTextEditor) {
		await diagnostics.init(mapperPath, collection, mybatisNamespaces);
	}

	// Update diagnostics when user opens/switches files
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			diagnostics.update(editor.document, collection, mapperPath, mybatisNamespaces);
		}
	}));

	// Update mybatisNamespaces and diagnostics when file is saved
	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(async doc => {
		if (doc) {
			// Updates namespaces if this is a file we care about
			if (doc.uri.path.startsWith(mapperPath)) {
				// Replace current mapperSpaces with new ones to account for users renaming files
				const newMapperSpaces = await parser.readMapperPath(mapperPath);
				mybatisNamespaces.names = [];
				mybatisNamespaces.paths = [];
				mybatisNamespaces.docs = [];
				mybatisNamespaces.details = [];

				// Save initial namespaces for this project
				for (const mapperSpace of newMapperSpaces) {
					mybatisNamespaces.names.push(mapperSpace.name);
					mybatisNamespaces.paths.push(mapperSpace.path);
					mybatisNamespaces.docs.push(await vscode.workspace.openTextDocument(mapperSpace.path));
					mybatisNamespaces.details.push(mapperSpace);
				}
			}

			// Update diagnostics
			diagnostics.update(doc, collection, mapperPath, mybatisNamespaces);
		}
	}));

	// Provide quickfixes
	context.subscriptions.push(vscode.languages.registerCodeActionsProvider('xml', new diagnostics.FixCarets(), {
		providedCodeActionKinds: diagnostics.FixCarets.providedCodeActionKinds
	}));

	// Provide definition links for namespaces
	context.subscriptions.push(vscode.languages.registerDefinitionProvider('xml', new namespaceActions.NamespaceDefinitionsProvider()));

	// Activation done
	vscode.window.showInformationMessage('Mybatis Language Support Online.');
}

export function deactivate() {
	vscode.window.showInformationMessage('Mybatis Language Support Offline!');
}

// Get code behind a specific refId, needs to be here to access our "globals"
export function lookupCodeBehindRefId(namespace: string, refId: string, self: vscode.TextDocument): (vscode.DefinitionLink | undefined) {
	// Get correct doc to work wiht
	const mapperIdx = mybatisNamespaces.names.indexOf(namespace);
	const doc = namespace ? mybatisNamespaces.docs[mapperIdx] : self;
	
	const formattedRefId = ` id="${refId}"`;
	if (doc.getText().includes(formattedRefId)) {
		const refIdIdx = doc.getText().indexOf(formattedRefId);
		// Find start and end of code block
		const codeStartIdx = doc.getText().lastIndexOf('<sql', refIdIdx);
		const codeEndIdx = doc.getText().indexOf('</sql>', refIdIdx) + 6;

		// If we found a full code block, return it
		if (codeStartIdx !== -1 && codeEndIdx !== -1) {
			return {
				targetUri: doc.uri,
				targetRange: new vscode.Range(doc.positionAt(codeStartIdx), doc.positionAt(codeEndIdx)),
				targetSelectionRange: new vscode.Range(doc.positionAt(codeStartIdx), doc.positionAt(codeEndIdx))
			};
		}
	}

	// No code found, return nothing
	return;
}
