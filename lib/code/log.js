'use babel';

const ILog = require('../interface/ilog');

module.exports = class Log extends ILog {
	/**
	 * @property {Log} instance - static
	 * @property {IConfig} config
	 */

	/**
	 * @constructor
	 * @param {IConfig} config
	 * @returns {Log}
	 */
	constructor(config) {
		if (!Log.instance) {
			super();
			this.config = config;
			Log.instance = this;
		}
		return Log.instance;
	}

	/**
	 * @param {IConfig} config
	 * @returns {Log}
	 */
	static getInstance(config) {
		if (!Log.instance) {
			Log.instance = new Log(config);
		}
		return Log.instance;
	}

	/**
	 * Print error message.
	 * @param {Object} args - Objects to print.
	 * @returns {void}
	 */
	err(...args) {
		console.log('E:', ...args);
	}

	/**
	 * Print warning message.
	 * @param {Object} args - Objects to print.
	 * @returns {void}
	 */
	warn(...args) {
		const l = this.config.get('logLevel');
		if (l !== 'E') {
			console.log('W:', ...args);
		}
	}

	/**
	 * Print information message.
	 * @param {Object} args - Objects to print.
	 * @returns {void}
	 */
	info(...args) {
		const l = this.config.get('logLevel');
		if (l === 'I') {
			console.log('I:', ...args);
		}
	}
}
