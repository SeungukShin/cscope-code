'use babel';

module.exports = class IStatusbar {
	/**
	 * @returns {void}
	 */
	destroy() {
		throw new Error('not implemented');
	}

	/**
	 * @param {StatusBarView} statusBar
	 * @returns {void}
	 */
	set(statusBar) {
		throw new Error('not implemented:', statusBar);
	}

	/**
	 * @param {String} message
	 * @returns {void}
	 */
	show(message) {
		throw new Error('not implemented:', message);
	}

	/**
	 * @returns {void}
	 */
	hide() {
		throw new Error('not implemented');
	}
}
