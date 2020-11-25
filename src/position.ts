import * as vscode from 'vscode';
import { Log } from './log';

export class Position {
	private log: Log;
	private file: string;
	private position: vscode.Position;

	constructor(file: string | undefined = undefined, position: vscode.Position | undefined = undefined) {
		this.log = Log.getInstance();
		const editor = vscode.window.activeTextEditor;
		if (file == undefined) {
			if (editor == undefined) {
				const msg: string = 'Cannot find Active Text Editor.';
				this.log.err(msg);
				vscode.window.showInformationMessage(msg);
			}
			file = editor!.document.uri.fsPath;
		}
		this.file = file;
		if (position == undefined) {
			position = editor!.selection.active;
		}
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

	async go(preview: boolean = false): Promise<vscode.TextEditor | undefined> {
		return new Promise<vscode.TextEditor | undefined>(async (resolve, reject) => {
			// open a document
			vscode.workspace.openTextDocument(this.file).then((f: vscode.TextDocument) => {
				const range: vscode.Range = new vscode.Range(this.position, this.position);
				let option: vscode.TextDocumentShowOptions = {
					preserveFocus: false,
					preview: false,
					selection: range,
					viewColumn: vscode.ViewColumn.Active
				};
				if (preview) {
					option.preserveFocus = true;
					option.preview = true;
					option.viewColumn = vscode.ViewColumn.Beside;
				}
				// open an editor
				vscode.window.showTextDocument(f, option).then((e: vscode.TextEditor) => {
					resolve(e);
				}), ((error: any) => {
					const msg: string = 'Cannot show "' + this.file + '".';
					this.log.err(msg);
					vscode.window.showInformationMessage(msg);
					reject(undefined);
				});
			}), ((error: any) => {
				const msg: string = 'Cannot open "' + this.file + '".';
				this.log.err(msg);
				vscode.window.showInformationMessage(msg);
				reject(undefined);
			});
		});
	}
}