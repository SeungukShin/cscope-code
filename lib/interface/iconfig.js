'use babel';

module.exports = class IConfig {
	/**
	 * Reload the config.
	 * @returns {void}
	 */
	reload() {
		throw new Error('not implemented');
	}

	/**
	 * Get a value for key from the config.
	 * @param {String} key - Key string for the config.
	 * @returns {Object} - Value of key from the config.
	 */
	get(key) {
		throw new Error('not implemented:', key);
	}

	/**
	 * Set a value for key to the config.
	 * @param {String} key - Key string for the config.
	 * @param {Object} value - Value for the key to store in the config.
	 * @returns {Promise<Boolean>} - Success or fail to store.
	 */
	async set(key, value) {
		throw new Error('not implemented:', key, value);
	}

	/**
	 * Register the callback to be called when value of key in the config is changed.
	 * @param {String} key - Key string for the config.
	 * @param {Function} callback - The callback function to be called.
	 * @returns {Object} - The disposable object to cancel the observation.
	 */
	observe(key, callback) {
		throw new Error('not implemented:', key, callback);
	}
}
