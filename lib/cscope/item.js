'use babel';

module.exports = class Item {
	/**
	 * @property {String} file
	 * @property {String} func
	 * @property {Number} line
	 * @property {String} text
	 * @property {String} raw
	 */

	/**
	 * @constructor
	 * @param {String} line
	 * @returns {Item}
	 */
	constructor(line) {
		const tokens = line.match(/([^ ]*) +([^ ]*) +([^ ]*) (.*)/);
		if (tokens == null || tokens.length < 5) {
			throw new Error('wrong format');
		}
		this.file = tokens[1];
		this.func = tokens[2];
		this.line = parseInt(tokens[3]) - 1;
		this.text = tokens[4];
		this.raw = line;
	}

	/**
	 * @returns {String}
	 */
	getFile() {
		return this.file;
	}

	/**
	 * @returns {String}
	 */
	getFunction() {
		return this.func;
	}

	/**
	 * @returns {Number}
	 */
	getLine() {
		return this.line;
	}

	/**
	 * @returns {String}
	 */
	getText() {
		return this.text;
	}

	/**
	 * @returns {String}
	 */
	getRaw() {
		return this.raw;
	}
}
