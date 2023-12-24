import * as vscode from 'vscode';
import { assert } from 'console';
import IConfig from '../interface/iconfig';

export default class Config implements IConfig {
	/**
	 * @property {Config} instance - instance
	 * @property {string} base - base name of this config
	 * @property {vscode.WorkspaceConfiguration} config
	 */
	private static instance: Config;
	private static base: string;
	private static config: vscode.WorkspaceConfiguration;

	/**
	 * @constructor
	 * @param {string} base
	 */
	private constructor(base: string) {
		if (!Config.instance) {
			Config.base = base;
			Config.config = vscode.workspace.getConfiguration(base);
			Config.instance = this;
		}
		return Config.instance;
	}

	/**
	 * Get the config
	 * @param {string} base
	 * @returns {Config}
	 */
	static getInstance(base: string): Config {
		if (!Config.instance) {
			new Config(base);
		}
		return Config.instance;
	}

	/**
	 * Reload the config.
	 * @returns {void}
	 */
	reload(): void {
		Config.config = vscode.workspace.getConfiguration(Config.base);
	}

	/**
	 * Get a value for key from the config.
	 * @param {string} key - Key string for the config.
	 * @returns {T} - Value of key from the config.
	 */
	get<T>(key: string): T {
		const value: T | undefined = Config.config.get(key);
		assert(typeof value !== undefined);
		return value as T;
	}

	/**
	 * Set a value for key to the config.
	 * @param {string} key - Key string for the config.
	 * @param {T} value - Value for the key to store in the config.
	 * @returns {Promise<boolean>} - Success or fail to store.
	 */
	async set<T>(key: string, value: T): Promise<boolean> {
		return new Promise(async (resolve, reject) => {
			try {
				await Config.config.update(key, value);
			} catch (err) {
				return reject(false);
			}
			return resolve(true);
		});
	}

	/**
	 * Register the callback to be called when value of key in the config is changed.
	 * @param {String} key - Key string for the config.
	 * @param {Function} callback - The callback function to be called.
	 * @returns {Object} - The disposable object to cancel the observation.
	 */
	observe(key: string, callback: () => void): vscode.Disposable {
		return vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration(`${Config.base}.${key}`)) {
				callback();
			}
		});
	}
}