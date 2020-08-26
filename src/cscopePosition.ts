import * as vscode from 'vscode';

export class CscopePosition {
    private file: string;
    private position: vscode.Position;

    constructor(file: string, position: vscode.Position) {
        this.file = file;
        this.position = position;
    }

	getFile(): string {
		return this.file;
	}

    getPosition(): vscode.Position {
        return this.position;
    }

	getLineNumber(): number {
		return this.position.line;
	}

	getColumnNumber(): number {
		return this.position.character;
	}
}