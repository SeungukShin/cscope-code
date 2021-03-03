'use babel';

module.exports = class History {
	/**
	 * @property {ILog} log
	 * @property {FilePosition[]} positions
	 */

	/**
	 * @constructor
	 * @param {ILog} log
	 * @returns {History}
	 */
	constructor(log) {
		this.log = log;
		this.positions = [];
	}

	/**
	 * @returns {FilePosition}
	 */
	pop() {
		const position = this.positions.pop();
		if (!position) {
			this.log.warn('End of History');
		}
		return position;
	}

	/**
	 * @constructor
	 * @param {FilePosition} position
	 * @returns {FilePosition}
	 */
	push(position) {
		this.positions.push(position);
		return position;
	}
}
