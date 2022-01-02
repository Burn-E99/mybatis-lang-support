import * as vscode from 'vscode';

// mapperPath getter
export const getMapperPath = async (showSaved: boolean): Promise<string> => {
	let mapperPath: string = vscode.workspace.getConfiguration('mybatis-lang-support').get('mapperPath') || '';

	// Make slash direction normal
	mapperPath = mapperPath.replace(/\\/g, '/');

	// Check if they are using a relative path
	if (mapperPath.startsWith('.') && vscode.workspace.workspaceFolders === undefined) {
		// Relative path used, workspace doesn't exist, so error
		vscode.window.showErrorMessage('Invalid path for Mapper Path.');
		return mapperPath;
	} else if (mapperPath.startsWith('.') && vscode.workspace.workspaceFolders !== undefined) {
		// Relative path used, workspace does exist, so prepend workspace path to the path
		mapperPath = `${vscode.workspace.workspaceFolders[0].uri.path}${mapperPath.substring(1)}`;
	}

	// Format string as URI
	mapperPath = vscode.Uri.file(mapperPath).path;

	if (!mapperPath.endsWith('/')) {
		mapperPath += '/';
	}

	// Vaidate path exists
	try {
		await vscode.workspace.fs.stat(vscode.Uri.file(mapperPath));
		// Path did exist, let user know it saved.
		showSaved && vscode.window.showInformationMessage('Path Saved!');
		return mapperPath;
	}
	catch (e) {
		// Path didn't exist, error 
		vscode.window.showErrorMessage('Invalid path for Mapper Path.');
		return "";
	}
};

// mapperTag getter
export const getMapperTag = (): string => {
	return vscode.workspace.getConfiguration('mybatis-lang-support').get('mapperTag') || 'mapper';
};
