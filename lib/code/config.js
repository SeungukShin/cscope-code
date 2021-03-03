'use babel';

const vscode = require('vscode');
const IConfig = require('../interface/iconfig');

module.exports = class Config extends IConfig {
	/**
	 * @property {Config} instance - static
	 * @property {String} database
	 * @property {vscode.WorkspaceConfiguration} config
	 */

	/**
	 * @constructor
	 * @param {String} base
	 * @returns {Config}
	 */
	constructor(base) {
		if (!Config.instance) {
			super();
			this.base = base;
			this.config = vscode.workspace.getConfiguration(base);
			Config.instance = this;
		}
		return Config.instance;
	}

	/**
	 * @param {String} base
	 * @returns {Config}
	 */
	static getInstance(base) {
		if (!Config.instance) {
			Config.instance = new Config(base);
		}
		return Config.instance;
	}

	/**
	 * Reload the config.
	 * @returns {void}
	 */
	reload() {
		this.config = vscode.workspace.getConfiguration(this.base);
	}

	/**
	 * Get a value for key from the config.
	 * @param {String} key - Key string for the config.
	 * @returns {Object} - Value of key from the config.
	 */
	get(key) {
		return this.config.get(key);
	}

	/**
	 * Set a value for key to the config.
	 * @param {String} key - Key string for the config.
	 * @param {Object} value - Value for the key to store in the config.
	 * @returns {Promise<Boolean>} - Success or fail to store.
	 */
	async set(key, value) {
		return new Promise(async (resolve, reject) => {
			try {
				await this.config.update(key, value);
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
	observe(key, callback) {
		return vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration(`${this.base}.${key}`)) {
				callback();
			}
		});
	}
}
