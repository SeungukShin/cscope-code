import ILog from "./ilog";
import { FilePosition } from "./position";

export default class History {
	/**
	 * @property {ILog} log
	 * @property {FilePosition[]} positions
	 */
	private log: ILog;
	private positions: FilePosition[];

	/**
	 * @constructor
	 * @param {ILog} log
	 */
	constructor(log: ILog) {
		this.log = log;
		this.positions = [];
	}

	/**
	 * Push
	 * @param {FilePosition} position
	 * @returns {FilePosition}
	 */
	push(position: FilePosition): FilePosition {
		this.positions.push(position);
		return position;
	}

	/**
	 * Pop
	 * @returns {FilePosition | undefined}
	 */
	pop(): FilePosition | undefined {
		const position = this.positions.pop();
		if (!position) {
			this.log.warn('End of History');
		}
		return position;
	}
}
