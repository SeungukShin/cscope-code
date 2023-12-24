export default interface IItem {
	/**
	 * Get the file name
	 * @returns {string}
	 */
	getFile(): string;

	/**
	 * Get the function name
	 * @returns {string}
	 */
	getFunction(): string;

	/**
	 * Get the line number
	 * @returns {number}
	 */
	getLine(): number;

	/**
	 * Get the text
	 * @returns {string}
	 */
	getText(): string;

	/**
	 * Get the raw text
	 * @returns {string}
	 */
	getRaw(): string;
}
