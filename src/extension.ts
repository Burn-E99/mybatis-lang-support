import * as vscode from 'vscode';
import { MybatisNamespaces } from './types';
import * as diagnostics from './diagnostics';
import * as parser from './parsers';
import * as utils from './utils';

// Init "global" vars
let mapperPath: string;
const mybatisNamespaces: MybatisNamespaces = {
	paths: [],
	names: [],
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

	// Update diagnostics when file is saved
	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(doc => {
		if (doc) {
			diagnostics.update(doc, collection, mapperPath, mybatisNamespaces);
		}
	}));

	// Provide quickfixes
	context.subscriptions.push(vscode.languages.registerCodeActionsProvider('xml', new diagnostics.FixCarets(), {
		providedCodeActionKinds: diagnostics.FixCarets.providedCodeActionKinds
	}));

	// Activation done
	vscode.window.showInformationMessage('Mybatis Language Support Online');
}

export function deactivate() {
	vscode.window.showInformationMessage('Mybatis Language Support Offline!');
}
