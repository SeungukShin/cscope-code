'use babel';

module.exports = class IEnv {
	/**
	 * @returns {void}
	 */
	destroy() {
		throw new Error('not implemented');
	}

	/**
	 * Get a current directory.
	 * @returns {String} - A current directory.
	 */
	getCurrentDirectory() {
		throw new Error('not implemented');
	}

	/**
	 * Get a current word under the cursor.
	 * @returns {String} - A current word.
	 */
	getCurrentWord() {
		throw new Error('not implemented');
	}

	/**
	 * Get a current position of the cursor.
	 * @returns {FilePosition} - A current position of the cursor.
	 */
	getCurrentPosition() {
		throw new Error('not implemented');
	}

	/**
	 * Open a file and return editor object.
	 * @param {FilePosition} position - A file name and cursor position.
	 * @param {Boolean} preview - A preview option.
	 * @returns {Promise<IEditor>} - An editor object.
	 */
	async open(position, preview) {
		throw new Error('not implemented:', position, preview);
	}

	/**
	 * Show an input box and get an input.
	 * @param {String} value - A default value.
	 * @returns {Promise<String>} - An input value.
	 */
	async getInput(value) {
		throw new Error('not implemented:', value);
	}

	/**
	 * Observe changes of files.
	 * @param {String} extensions - File extensions to observe.
	 * @param {Function} callback - A callback function to call when a file is changed.
	 * @returns {Object} - A disposible object.
	 */
	observeFiles(extensions, callback) {
		throw new Error('not implemented:', extensions, callback);
	}
}
