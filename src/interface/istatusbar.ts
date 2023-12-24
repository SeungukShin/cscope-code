export default interface IStatusbar {
	/**
	 * Destroy
	 * @returns {void}
	 */
	destroy(): void;

	/**
	 * Set a status bar instance
	 * @param {any} statusBar
	 * @returns {void}
	 */
	set(statusBar: any): void;

	/**
	 * Show the message on the status bar
	 * @param {string} message
	 * @returns {void}
	 */
	show(message: string): void;

	/**
	 * Hide any message on the status bar
	 * @returns {void}
	 */
	hide(): void;
}
