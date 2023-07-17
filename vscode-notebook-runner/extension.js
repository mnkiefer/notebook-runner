const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	console.log('The extension "vscode-notebook-runner" is now active!');

	let disposable = vscode.commands.registerCommand('vscode-notebook-runner.hello', function () {
		vscode.window.showInformationMessage('Hello from vscode-notebook-runner!');
	});

	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
