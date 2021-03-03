'use babel';

const vscode = require('vscode');
const IStatusbar = require('../interface/istatusbar');

module.exports = class Statusbar extends IStatusbar {
	/**
	 * @property {Statusbar} instance - static
	 * @property {vscode.Disposable} disposable
	 */

	/**
	 * @constructor
	 * @returns {Statusbar}
	 */
	constructor() {
		if (!Statusbar.instance) {
			super();
			this.disposable = null;
			Statusbar.instance = this;
		}
		return Statusbar.instance;
	}

	/**
	 * @returns {Statusbar}
	 */
	static getInstance() {
		if (!Statusbar.instance) {
			Statusbar.instance = new Statusbar();
		}
		return Statusbar.instance;
	}

	/**
	 * @returns {void}
	 */
	destroy() {
		if (this.disposable) {
			this.disposable.dispose();
			this.disposable = null;
		}
	}

	/**
	 * @param {StatusBarView} statusBar
	 * @returns {void}
	 */
	set() {}

	/**
	 * @param {String} message
	 * @returns {void}
	 */
	show(message) {
		if (this.disposable) {
			this.disposable.dispose();
		}
		this.disposable = vscode.window.setStatusBarMessage(message);
	}

	/**
	 * @returns {void}
	 */
	hide() {
		if (this.disposable) {
			this.disposable.dispose();
			this.disposable = null;
		}
	}
}
