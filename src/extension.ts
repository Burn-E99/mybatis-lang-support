import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "mybatis-lang-support" is now active!');
	vscode.window.showInformationMessage('Hello World!');

	let disposable = vscode.commands.registerCommand('mybatis-lang-support.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World command!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {
	vscode.window.showInformationMessage('mybatis-lang-support deactivating!');
}
