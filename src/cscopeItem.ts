import * as vscode from 'vscode';

export class CscopeItem implements vscode.QuickPickItem {
	private uri: vscode.Uri;
	private function: string;
	private range: vscode.Range;
	private rest: string;
	private text: string;
	// for QuickPickItem
	label: string;

	constructor(uri: vscode.Uri, func: string, range: vscode.Range, rest: string, text: string) {
		const offset = vscode.workspace.rootPath ? vscode.workspace.rootPath.length + 1 : 0;
		this.uri = uri;
		this.function = func;
		this.range = range;
		this.rest = rest;
		this.text = text;
		this.label = func + ' : ' + rest;
	}

	getUri(): vscode.Uri {
		return this.uri;
	}

	getFile(): string {
		return this.uri.fsPath;
	}

	getFunction(): string {
		return this.function;
	}

	getRange(): vscode.Range {
		return this.range;
	}

	getLineNumber(): number {
		return this.range.start.line;
	}

	getColumnNumber(): number {
		return this.range.start.character;
	}

	getLine(): string {
		return this.rest;
	}
}