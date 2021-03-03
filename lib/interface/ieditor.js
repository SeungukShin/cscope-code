'use babel';

module.exports = class IEditor {
	/**
	 * @returns {Promise<void>}
	 */
	async close() {
		throw new Error('not implemented');
	}

	/**
	 * @returns {String}
	 */
	getText() {
		throw new Error('not implemented');
	}

	/**
	 * @param {Number} line
	 * @returns {String}
	 */
	getTextLine(line) {
		throw new Error('not implemented:', line);
	}

	/**
	 * @returns {void}
	 */
	destroy() {
		throw new Error('not implemented');
	}
}
