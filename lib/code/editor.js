'use babel';

const vscode = require('vscode');
const IEditor = require('../interface/ieditor');

module.exports = class Editor extends IEditor {
	/**
	 * @property {vscode.TextEditor} editor
	 */

	/**
	 * @constructor
	 * @param {vscode.TextEditor} editor
	 * @returns {Editor}
	 */
	constructor(editor) {
		super();
		this.editor = editor;
	}

	/**
	 * @returns {String}
	 */
	getText() {
		return this.editor.document.getText();
	}

	/**
	 * @param {Number} line
	 * @returns {String}
	 */
	getTextLine(line) {
		return this.editor.document.lineAt(line).text;
	}

	/**
	 * @returns {Promise<void>}
	 */
	async close() {
		if (this.editor) {
			await vscode.window.showTextDocument(this.editor.document);
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
			this.editor = null;
		}
	}

	/**
	 * @returns {void}
	 */
	destroy() {}
}
