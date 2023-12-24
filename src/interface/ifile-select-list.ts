import * as vscode from 'vscode';
import IItem from './iitem';

export default interface IFileSelectList {
	/**
	 * Destroy
	 * @returns {void}
	 */
	destroy(): void;

	/**
	 * Update items on file select list
	 * @param {IItem[]} items
	 * @param {string} word
	 * @param {string} cwd
	 * @returns {void}
	 */
	update(items: IItem[], word: string, cwd: string): void;

	/**
	 * Show the file select list
	 * @returns {Promise<boolean>}
	 */
	show(): Promise<boolean>;

	/**
	 * Hide the file select list
	 * @returns {Promise<void>}
	 */
	hide(): Promise<void>;
}
