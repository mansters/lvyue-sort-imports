// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import sortInsideEditor from './sortInsideEditor';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "lvyue-sort-import" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerTextEditorCommand('extension.sortImportWithLvyueSpecification', (textEditor, edit) => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		// vscode.window.showInformationMessage(`当前文件(夹)的路径是: ${uri ? uri.path : '空'}`);
		if (isFileJavascript() || isFileTypescript()) {
			console.log('您正在执行编辑器命令！');
			// console.log(textEditor, edit);
			sortInsideEditor();
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function isFileJavascript() {
	return (
		vscode.window.activeTextEditor!.document.languageId === 'javascript' ||
		vscode.window.activeTextEditor!.document.languageId === 'javascriptreact'
	);
}

function isFileTypescript() {
	return (
		vscode.window.activeTextEditor!.document.languageId === 'typescript' ||
		vscode.window.activeTextEditor!.document.languageId === 'typescriptreact'
	);
}

export function deactivate() { }
