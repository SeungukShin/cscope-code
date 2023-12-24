export default interface IEditor {
	/**
	 * Get all text in the editor
	 * @returns {string | undefined}
	 */
	getText(): string | undefined;

	/**
	 * Get text at the line
	 * @param {number} line
	 * @returns {string | undefined}
	 */
	getTextLine(line: number): string | undefined;

	/**
	 * Set the cursor position
	 * @param {number} line
	 * @param {number} column
	 * @returns {void}
	 */
	setCurosr(line: number, column: number): void;

	/**
	 * Close the editor
	 * @returns {Promise<void>}
	 */
	close(): Promise<void>;

	/**
	 * Destroy
	 * @returns {void}
	 */
	destroy(): void;
}
