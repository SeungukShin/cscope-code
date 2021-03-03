'use babel';

const path = require('path');
const vscode = require('vscode');
const { IFileSelectListItem, IFileSelectList } = require('../interface/ifile-select-list');

class FileSelectListItem extends IFileSelectListItem {
	/**
	 * @property {String} file
	 * @property {Number} line
	 * @property {Number} column
	 * @property {String} label
	 * @property {String} detail
	 */

	/**
	 * @constructor
	 * @param {String} file
	 * @param {Number} line
	 * @param {Number} column
	 * @param {String} label
	 * @param {String} detail
	 * @returns {FileSelectListItem}
	 */
	constructor(file, line, column, label, detail) {
		super();
		this.file = file;
		this.line = line;
		this.column = column;
		this.label = `${label}: ${detail}`;
		const ext = path.extname(file);
		const icon = (ext === '.c') ? '$(symbol-method)' : (ext === '.h') ? '$(symbol-field)' : '$(symbol-file)';
		this.detail = `${icon} ${file}: ${line}`;
	}

	/**
	 * @returns {String}
	 */
	getFile() {
		return this.file;
	}

	/**
	 * @returns {Number}
	 */
	getLine() {
		return this.line;
	}

	/**
	 * @returns {Number}
	 */
	getColumn() {
		return this.column;
	}

	/**
	 * @returns {String}
	 */
	getLabel() {
		return this.label;
	}

	/**
	 * @returns {String}
	 */
	getDetail() {
		return this.detail;
	}

	/**
	 * @param {String} file
	 * @returns {void}
	 */
	setFile(file) {
		this.file = file;
	}

	/**
	 * @param {Number} line
	 * @returns {void}
	 */
	setLine(line) {
		this.line = line;
	}

	/**
	 * @param {Number} column
	 * @returns {void}
	 */
	setColumn(column) {
		this.column = column;
	}

	/**
	 * @param {String} label
	 * @returns {void}
	 */
	setLabel(label) {
		this.label = label;
	}

	/**
	 * @param {String} detail
	 * @returns {void}
	 */
	setDetail(detail) {
		this.detail = detail;
	}
}

class FileSelectList extends IFileSelectList {
	/**
	 * @property {vscode.QuickPick} quickPick
	 * @property {String} word
	 * @property {String} cwd
	 * @property {Boolean} previewOption
	 * @property {vscode.TextEditor[]} previewEditors
	 * @property {Function} resolve
	 * @property {Function} reject
	 */

	/**
	 * @constructor
	 * @param {IFileSelectListItem[]} items
	 * @param {String} word
	 * @param {String} cwd
	 * @param {Boolean} preview
	 * @returns {FileSelectList}
	 */
	constructor(items, word, cwd, preview) {
		super();
		this.word = word;
		this.cwd = cwd;
		this.previewOption = preview;
		this.previewEditors = [];
		this.resolve = null;
		this.reject = null;
		this.quickPick = vscode.window.createQuickPick();
		this.quickPick.items = items;
	}

	/**
	 * @returns {void}
	 */
	destroy() {
		this.quickPick.hide();
		this.quickPick.dispose();
	}

	/**
	 * @param {IFileSelectListItem[]} items
	 * @param {String} word
	 * @param {String} cwd
	 * @returns {void}
	 */
	update(items, word, cwd) {
		this.word = word;
		this.cwd = cwd;
		this.quickPick.items = items;
	}

	/**
	 * @returns {Promise<IFileSelectListItem>}
	 */
	async show() {
		return new Promise((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
			this.quickPick.onDidAccept(() => this.select());
			this.quickPick.onDidHide(() => this.hide());
			this.quickPick.onDidChangeActive(() => this.preview());
			this.quickPick.show();
		});
	}

	/**
	 * @returns {Promise<void>}
	 */
	async hide() {
		this.quickPick.hide();
		if (this.reject) {
			this.reject();
			this.resolve = null;
			this.reject = null;
		}
		if (this.previewEditors.length > 0) {
			for (const editor of this.previewEditors) {
				await vscode.window.showTextDocument(editor.document, { preview: true, viewColumn: vscode.ViewColumn.Beside });
				await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
			}
			this.previewEditors = [];
		}
	}

	/**
	 * @returns {Promise<void>}
	 */
	async preview() {
		if (!this.previewOption) {
			return;
		}
		const item = this.quickPick.activeItems[0];
		if (!item) {
			return;
		}
		const uri = path.join(this.cwd, item.getFile());
		const line = item.getLine();
		vscode.workspace.openTextDocument(uri).then(async (document) => {
			const text = document.lineAt(line).text;
			let column = text.indexOf(this.word);
			if (column < 0) {
				column = 0;
			}
			const range = new vscode.Range(line, column, line, column);
			const options = {
				preserveFocus: true,
				preview: true,
				selection: range,
				viewColumn: vscode.ViewColumn.Beside
			}
			vscode.window.showTextDocument(document, options).then((editor) => {
				if (!this.previewEditors.includes(editor)) {
					this.previewEditors.push(editor);
				}
			});
		});
	}

	/**
	 * @returns {Promise<void>}
	 */
	async select() {
		if (!this.resolve) {
			return;
		}
		const item = this.quickPick.selectedItems[0];
		if (!item) {
			return;
		}
		const uri = path.join(this.cwd, item.getFile());
		const line = item.getLine();
		vscode.workspace.openTextDocument(uri).then((document) => {
			const text = document.lineAt(line).text;
			let column = text.indexOf(this.word);
			if (column < 0) {
				column = 0;
			}
			const range = new vscode.Range(line, column, line, column);
			const options = {
				preserveFocus: false,
				preview: false,
				selection: range,
				viewColumn: vscode.ViewColumn.Active
			}
			vscode.window.showTextDocument(document, options);
			item.setColumn(column);
			this.resolve(item);
			this.resolve = null;
			this.reject = null;
		});
	}
}

module.exports = {
	FileSelectListItem,
	FileSelectList
}
