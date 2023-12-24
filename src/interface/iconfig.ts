import * as vscode from 'vscode';

export default interface IConfig {
	/**
	 * Reload the config.
	 * @returns {void}
	 */
	reload(): void;

	/**
	 * Get a value for key from the config.
	 * @param {string} key - Key string for the config.
	 * @returns {T} - Value of key from the config.
	 */
	get<T>(key: string): T;

	/**
	 * Set a value for key to the config.
	 * @param {string} key - Key string for the config.
	 * @param {T} value - Value for the key to store in the config.
	 * @returns {Promise<boolean>} - Success or fail to store.
	 */
	set<T>(key: string, value: T): Promise<boolean>;

	/**
	 * Register the callback to be called when value of key in the config is changed.
	 * @param {string} key - Key string for the config.
	 * @param {() => void} callback - The callback function to be called.
	 * @returns {vscode.Disposable} - The disposable object to cancel the observation.
	 */
	observe(key: string, callback: () => void): vscode.Disposable;
}
