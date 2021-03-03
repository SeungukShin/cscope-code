'use babel';

class Position {
	/**
	 * @property {Number} line
	 * @property {Number} column
	 */

	/**
	 * @constructor
	 * @param {Number} line
	 * @param {Number} column
	 * @returns {Position}
	 */
	constructor(line, column) {
		this.line = line;
		this.column = column;
	}

	/**
	 * @returns {Number}
	 */
	getLine() {
		return this.line;
	}

	/**
	 * @returns {Number}
	 */
	getColumn() {
		return this.column;
	}
}

class FilePosition extends Position {
	/**
	 * @property {String} file
	 */

	/**
	 * @constructor
	 * @param {String} file
	 * @param {Number} line
	 * @param {Number} column
	 * @returns {Position}
	 */
	constructor(file, line, column) {
		super(line, column);
		this.file = file;
	}

	/**
	 * @returns {String}
	 */
	getFile() {
		return this.file;
	}
}

module.exports = {
	Position,
	FilePosition
}
