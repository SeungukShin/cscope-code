'use babel';

const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const History = require('./interface/history');
const Config = require('./code/config');
const Log = require('./code/log');
const Statusbar = require('./code/statusbar');
const Env = require('./code/env');
const { FileSelectListItem, FileSelectList } = require('./code/file-select-list');
const Cscope = require('./cscope/cscope');

class CscopeCode {
	/**
	 * @property {vscode.Disposable[]} subscriptions
	 * @property {vscode.Disposable} buildDisposable
	 * @property {IConfig} config
	 * @property {ILog} log
	 * @property {IEnv} env
	 * @property {IStatusbar} statusbar
	 * @property {History} history
	 * @property {Cscope} cscope
	 * @property {String} prevWord
	 * @property {String} prevCwd
	 * @property {IFileSelectListItem[]} prevResults
	 */

	/**
	 * @constructor
	 * @param {vscode.ExtensionContext} context
	 * @returns {void}
	 */
	constructor(context) {
		this.subscriptions = context.subscriptions;
		this.buildDisposable = null;
		this.config = new Config('cscope-code');
		this.log = new Log(this.config);
		this.env = new Env();
		this.statusbar = new Statusbar();
		this.history = new History(this.log);
		this.cscope = new Cscope(this.config, this.log, this.env);
		this.prevWord = null;
		this.prevCwd = null;
		this.prevResults = null;

		// Auto build
		if (this.config.get('auto')) {
			const root = this.env.getCurrentDirectory();
			const db = path.join(root, this.config.get('database'));
			fs.access(db, fs.constants.F_OK, (err) => {
				if (err) {
					this.build();
				}
			});
			this.setBuild();
		}
		this.subscriptions.push(this.config.observe('auto', (() => {
			this.config.reload();
			if (this.config.get('auto')) {
				this.setBuild();
			} else {
				this.clearBuild();
			}
		})));

		// Register commands
		this.subscriptions.push(vscode.commands.registerCommand("cscope-code:build", () => this.build()));
		this.subscriptions.push(vscode.commands.registerCommand("cscope-code:symbol", () => this.query('symbol', false)));
		this.subscriptions.push(vscode.commands.registerCommand("cscope-code:symbol-input", () => this.query('symbol', true)));
		this.subscriptions.push(vscode.commands.registerCommand("cscope-code:definition", () => this.query('definition', false)));
		this.subscriptions.push(vscode.commands.registerCommand("cscope-code:definition-input", () => this.query('definition', true)));
		this.subscriptions.push(vscode.commands.registerCommand("cscope-code:callee", () => this.query('callee', false)));
		this.subscriptions.push(vscode.commands.registerCommand("cscope-code:callee-input", () => this.query('callee', true)));
		this.subscriptions.push(vscode.commands.registerCommand("cscope-code:caller", () => this.query('caller', false)));
		this.subscriptions.push(vscode.commands.registerCommand("cscope-code:caller-input", () => this.query('caller', true)));
		this.subscriptions.push(vscode.commands.registerCommand("cscope-code:text", () => this.query('text', false)));
		this.subscriptions.push(vscode.commands.registerCommand("cscope-code:text-input", () => this.query('text', true)));
		this.subscriptions.push(vscode.commands.registerCommand("cscope-code:egrep", () => this.query('egrep', false)));
		this.subscriptions.push(vscode.commands.registerCommand("cscope-code:egrep-input", () => this.query('egrep', true)));
		this.subscriptions.push(vscode.commands.registerCommand("cscope-code:file", () => this.query('file', false)));
		this.subscriptions.push(vscode.commands.registerCommand("cscope-code:file-input", () => this.query('file', true)));
		this.subscriptions.push(vscode.commands.registerCommand("cscope-code:include", () => this.query('include', false)));
		this.subscriptions.push(vscode.commands.registerCommand("cscope-code:include-input", () => this.query('include', true)));
		this.subscriptions.push(vscode.commands.registerCommand("cscope-code:set", () => this.query('set', false)));
		this.subscriptions.push(vscode.commands.registerCommand("cscope-code:set-input", () => this.query('set', true)));
		this.subscriptions.push(vscode.commands.registerCommand("cscope-code:show-results", () => this.showResults()));
		this.subscriptions.push(vscode.commands.registerCommand("cscope-code:pop", () => this.pop()));

		this.log.info('"cscope-code" is now active!');
	}

	/**
	 * @returns {void}
	 */
	dispose() {
		if (this.buildDisposable) {
			this.buildDisposable.dispose();
			this.buildDisposable = null;
		}
		this.statusbar.destroy();
		this.env.destroy();

		this.log.info('"cscope-code" is now inactive!');
	}

	/**
	 * @returns {void}
	 */
	setBuild() {
		if (this.buildDisposable) {
			return;
		}
		this.buildDisposable = this.env.observeFiles(this.config.get('extensions'), this.build.bind(this));
	}

	/**
	 * @returns {void}
	 */
	clearBuild() {
		if (this.buildDisposable) {
			this.buildDisposable.dispose();
			this.buildDisposable = null;
		}
	}

	/**
	 * @returns {Promise<void>}
	 */
	async build() {
		this.statusbar.show('cscope-code: building...');
		try {
			await this.cscope.build(this.env.getCurrentDirectory());
		} catch (err) {
			this.log.err(err);
		}
		this.statusbar.hide();
	}

	/**
	 * @param {String} type
	 * @param {String} word
	 * @param {String} cwd
	 * @returns {Promise<Item[]>}
	 */
	async __query(type, word, cwd) {
		this.statusbar.show('cscope-code: querying...');
		let results = null;
		try {
			results = await this.cscope.query(type, word, cwd);
		} catch (err) {
			this.log.err(err);
		}
		this.statusbar.hide();
		return results;
	}

	/**
	 * @param {IFileSelectListItem[]} items
	 * @param {String} word
	 * @param {String} cwd
	 * @returns {Promise<IFileSelectListItem>}
	 */
	async __showList(items, word, cwd) {
		let item = null;
		const selectList = new FileSelectList(items, word, cwd, true);
		try {
			item = await selectList.show();
		} catch (err) {
			this.log.err(err);
		}
		selectList.destroy();
		return item;
	}

	/**
	 * @param {String} type
	 * @param {Boolean} input
	 * @returns {Promise<void>}
	 */
	async query(type, input) {
		const cwd = this.env.getCurrentDirectory();
		let word = this.env.getCurrentWord();
		if (input) {
			try {
				word = await this.env.getInput(word);
			} catch (err) {
				this.log.err(err);
				return;
			}
		}
		const results = await this.__query(type, word, cwd);
		const items = [];
		for (const item of results) {
			const litem = new FileSelectListItem(item.getFile(), item.getLine(), null, item.getFunction(), item.getText());
			items.push(litem);
		}
		this.prevWord = word;
		this.prevCwd = cwd;
		this.prevResults = items;
		const position = this.env.getCurrentPosition();
		const item = await this.__showList(items, word, cwd);
		if (!item) {
			return;
		}
		if (position) {
			this.history.push(position);
		}
	}

	/**
	 * @returns {Promise<void>}
	 */
	async showResults() {
		if (!this.prevResults) {
			return;
		}
		const position = this.env.getCurrentPosition();
		const item = await this.__showList(this.prevResults, this.prevWord, this.prevCwd);
		if (!item) {
			return;
		}
		if (position) {
			this.history.push(position);
		}
	}

	/**
	 * @returns {Promise<FilePosition>}
	 */
	async pop() {
		const position = this.history.pop();
		if (position) {
			this.env.open(position, false);
		}
		return position;
	}
}

let cscopeCode = null;

/**
 * @param {vscode.ExtensionContext} context
 * @returns {void}
 */
const activate = (context) => {
	cscopeCode = new CscopeCode(context);
}

/**
 * @returns {void}
 */
const deactivate = () => {
	if (cscopeCode) {
		cscopeCode.dispose();
		cscopeCode = null;
	}
}

module.exports = {
	activate,
	deactivate
}
