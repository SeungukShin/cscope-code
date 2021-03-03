'use babel';

const path = require('path');
const process = require('process');
const vscode = require('vscode');
const IEnv = require('../interface/ienv');
const { FilePosition } = require('../interface/position');
const Editor = require('./editor');

module.exports = class Env extends IEnv {
	/**
	 * @property {Env} instance - static
	 */

	/**
	 * @constructor
	 * @returns {Env}
	 */
	constructor() {
		if (!Env.instance) {
			super();
			Env.instance = this;
		}
		return Env.instance;
	}

	/**
	 * @returns {Env}
	 */
	static getInstance() {
		if (!Env.instance) {
			Env.instance = new Env();
		}
		return Env.instance;
	}

	/**
	 * @returns {void}
	 */
	destroy() {}

	/**
	 * Get a current directory.
	 * @returns {String} - A current directory.
	 */
	getCurrentDirectory() {
		const workspaces = vscode.workspace.workspaceFolders;
		if (workspaces.length > 0) {
			return workspaces[0].uri.fsPath;
		}
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const file = editor.document.uri.fsPath;
			return path.dirname(file);
		}
		if (process.env.home) {
			return process.env.home;
		}
		return '';
	}

	/**
	 * Get a current word under the cursor.
	 * @returns {String} - A current word.
	 */
	getCurrentWord() {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return '';
		}
		const document = editor.document;
		const selection = editor.selection;
		if (!selection.isEmpty) {
			return document.getText(selection);
		}
		const range = document.getWordRangeAtPosition(selection.active);
		if (!range) {
			return '';
		}
		return document.getText(range);
	}

	/**
	 * Get a current position of the cursor.
	 * @returns {FilePosition} - A current position of the cursor.
	 */
	getCurrentPosition() {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return null;
		}
		const document = editor.document;
		const selection = editor.selection;
		const file = document.uri.fsPath;
		const point = selection.active;
		return new FilePosition(file, point.line, point.character);
	}

	/**
	 * Open a file and return editor object.
	 * @param {FilePosition} position - A file name and cursor position.
	 * @param {Boolean} preview - A preview option.
	 * @returns {Promise<IEditor>} - An editor object.
	 */
	async open(position, preview) {
		return new Promise((resolve, reject) => {
			vscode.workspace.openTextDocument(position.getFile()).then((document) => {
				const range = new vscode.Range(position.getLine(), position.getColumn(), position.getLine(), position.getColumn());
				let options = {
					preserveFocus: false,
					preview: false,
					selection: range,
					viewColumn: vscode.ViewColumn.Active
				};
				if (preview) {
					options.preserveFocus = true;
					options.preview = true;
					options.viewColumn = vscode.ViewColumn.Beside;
				}
				vscode.window.showTextDocument(document, options).then((editor) => {
					resolve(new Editor(editor));
				}), ((error) => {
					reject(error);
				});
			}), ((error) => {
				reject(error);
			});
		});
	}

	/**
	 * Show an input box and get an input.
	 * @param {String} value - A default value.
	 * @returns {Promise<String>} - An input value.
	 */
	async getInput(value) {
		return vscode.window.showInputBox({ value: value });
	}

	/**
	 * Observe changes of files.
	 * @param {String} extensions - File extensions to observe.
	 * @param {Function} callback - A callback function to call when a file is changed.
	 * @returns {Object} - A disposible object.
	 */
	observeFiles(extensions, callback) {
		const root = this.getCurrentDirectory();
		const pattern = path.posix.join(root, '**/*.{' + extensions + '}');
		const fswatcher = vscode.workspace.createFileSystemWatcher(pattern);
		fswatcher.onDidChange(() => callback());
		fswatcher.onDidCreate(() => callback());
		fswatcher.onDidDelete(() => callback());
		return fswatcher;
	}
}
