export class Position {
	/**
	 * @property {number} line - line number
	 * @property {number} column - column number
	 */
	private line: number;
	private column: number;

	/**
	 * @constructor
	 * @param {number} line - line number
	 * @param {number} column - column number
	 */
	constructor(line: number, column: number) {
		this.line = line;
		this.column = column;
	}

	/**
	 * Get line number
	 * @returns {number}
	 */
	getLine(): number {
		return this.line;
	}

	/**
	 * Get column number
	 * @returns {number}
	 */
	getColumn(): number {
		return this.column;
	}

	/**
	 * Set line number
	 * @param {number} line
	 * @returns {void}
	 */
	setLine(line: number): void {
		this.line = line;
	}

	/**
	 * Set column number
	 * @param {number} column
	 * @returns {void}
	 */
	setColumn(column: number): void {
		this.column = column;
	}
}

export class FilePosition extends Position {
	/**
	 * @property {string} file - file name
	 */
	private file: string;

	/**
	 * @constructor
	 * @param {string} file - file name
	 * @param {number} line - line number
	 * @param {number} column - column number
	 */
	constructor(file: string, line: number, column: number) {
		super(line, column);
		this.file = file;
	}

	/**
	 * Get file name
	 * @returns {string}
	 */
	getFile(): string {
		return this.file;
	}

	/**
	 * Set file name
	 * @param {string} file
	 * @returns {void}
	 */
	setFile(file: string): void {
		this.file = file;
	}
}
