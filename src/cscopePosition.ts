import * as vscode from 'vscode';

export class CscopePosition {
	private file: string;
	private line: number;
	private column: number;

	constructor(file: string, line: number, column: number) {
		this.file = file;
		this.line = line;
		this.column = column;
	}

	getFile(): string {
		return this.file;
	}

	getLineNumber(): number {
		return this.line;
	}

	getColumnNumber(): number {
		return this.column;
	}
}