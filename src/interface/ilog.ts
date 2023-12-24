export default interface ILog {
	/**
	 * Print error message.
	 * @param {any[]} args - Objects to print.
	 * @returns {void}
	 */
	err(...args: any[]): void;

	/**
	 * Print warning message.
	 * @param {any[]} args - Objects to print.
	 * @returns {void}
	 */
	warn(...args: any[]): void;

	/**
	 * Print information message.
	 * @param {any[]} args - Objects to print.
	 * @returns {void}
	 */
	info(...args: any[]): void;
}
