import * as vscode from 'vscode';
import IStatusbar from '../interface/istatusbar';

export default class Statusbar implements IStatusbar {
	/**
	 * @property {Statusbar} instance - instance
	 * @property {vscode.Disposable} disposable
	 */
	private static instance: Statusbar;
	private disposable: vscode.Disposable | undefined;

	/**
	 * @constructor
	 */
	private constructor() {
		if (!Statusbar.instance) {
			this.disposable = undefined;
			Statusbar.instance = this;
		}
		return Statusbar.instance;
	}

	/**
	 * Get the statusbar
	 * @returns {Statusbar}
	 */
	static getInstance(): Statusbar {
		if (!Statusbar.instance) {
			new Statusbar();
		}
		return Statusbar.instance;
	}

	/**
	 * Destroy
	 * @returns {void}
	 */
	destroy(): void {
		this.disposable?.dispose();
		this.disposable = undefined;
	}

	/**
	 * Set a status bar instance
	 * @param {any} statusBar
	 * @returns {void}
	 */
	set(statusBar: any): any {}

	/**
	 * Show the message on the status bar
	 * @param {string} message
	 * @returns {void}
	 */
	show(message: string): void {
		this.disposable?.dispose();
		this.disposable = vscode.window.setStatusBarMessage(message);
	}

	/**
	 * Hide any message on the status bar
	 * @returns {void}
	 */
	hide(): void {
		this.disposable?.dispose();
		this.disposable = undefined
	}
}
