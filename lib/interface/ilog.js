'use babel';

module.exports = class ILog {
	/**
	 * Print error message.
	 * @param {Object} args - Objects to print.
	 * @returns {void}
	 */
	err(...args) {
		throw new Error('not implemented:', ...args);
	}

	/**
	 * Print warning message.
	 * @param {Object} args - Objects to print.
	 * @returns {void}
	 */
	warn(...args) {
		throw new Error('not implemented:', ...args);
	}

	/**
	 * Print information message.
	 * @param {Object} args - Objects to print.
	 * @returns {void}
	 */
	info(...args) {
		throw new Error('not implemented:', ...args);
	}
}
