'use babel';

class IFileSelectListItem {
	/**
	 * @returns {String}
	 */
	getFile() {
		throw new Error('not implemented');
	}

	/**
	 * @returns {Number}
	 */
	getLine() {
		throw new Error('not implemented');
	}

	/**
	 * @returns {Number}
	 */
	getColumn() {
		throw new Error('not implemented');
	}

	/**
	 * @returns {String}
	 */
	getLabel() {
		throw new Error('not implemented');
	}

	/**
	 * @returns {String}
	 */
	getDetail() {
		throw new Error('not implemented');
	}

	/**
	 * @param {String} file
	 * @returns {void}
	 */
	setFile(file) {
		throw new Error('not implemented:', file);
	}

	/**
	 * @param {Number} line
	 * @returns {void}
	 */
	setLine(line) {
		throw new Error('not implemented:', line);
	}

	/**
	 * @param {Number} column
	 * @returns {void}
	 */
	setColumn(column) {
		throw new Error('not implemented:', column);
	}

	/**
	 * @param {String} label
	 * @returns {void}
	 */
	setLabel(label) {
		throw new Error('not implemented:', label);
	}

	/**
	 * @param {String} detail
	 * @returns {void}
	 */
	setDetail(detail) {
		throw new Error('not implemented:', detail);
	}
}

class IFileSelectList {
	/**
	 * @returns {void}
	 */
	destroy() {
		throw new Error('not implemented');
	}

	/**
	 * @param {IFileSelectListItem[]} items
	 * @param {String} word
	 * @param {String} cwd
	 * @returns {void}
	 */
	update(items, word, cwd) {
		throw new Error('not implemented:', items, word, cwd);
	}

	/**
	 * @returns {Promise<IFileSelectListItem>}
	 */
	async show() {
		throw new Error('not implemented');
	}

	/**
	 * @returns {Promise<void>}
	 */
	async hide() {
		throw new Error('not implemented');
	}
}

module.exports = {
	IFileSelectListItem,
	IFileSelectList
}
