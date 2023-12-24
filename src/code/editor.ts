import * as vscode from 'vscode';
import IEditor from '../interface/ieditor';

export default class Editor implements IEditor {
	/**
	 * @property {vscode.TextEditor} editor
	 */
	editor: vscode.TextEditor | undefined;

	/**
	 * @constructor
	 * @param {vscode.TextEditor} editor
	 */
	constructor(editor: vscode.TextEditor) {
		this.editor = editor;
	}

	/**
	 * Get all text in the editor
	 * @returns {string | undefined}
	 */
	getText(): string | undefined{
		return this.editor?.document.getText();
	}

	/**
	 * Get text at the line
	 * @param {number} line
	 * @returns {string | undefined}
	 */
	getTextLine(line: number): string | undefined {
		return this.editor?.document.lineAt(line).text;
	}

	/**
	 * Set the cursor position
	 * @param {number} line
	 * @param {number} column
	 * @returns {void}
	 */
	setCurosr(line: number, column: number): void {
		const position = new vscode.Position(line, column);
		if (this.editor) {
			this.editor.selections = [new vscode.Selection(position, position)];
		}
	}

	/**
	 * Close the editor
	 * @returns {Promise<void>}
	 */
	async close(): Promise<void> {
		if (this.editor) {
			await vscode.window.showTextDocument(this.editor.document, { viewColumn: this.editor.viewColumn });
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
			this.editor = undefined;
		}
	}

	/**
	 * Destroy
	 * @returns {void}
	 */
	destroy(): void {}
}
