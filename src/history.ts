import * as vscode from 'vscode';
import { Log } from './log';
import { Position } from './position';

export class History {
	private log: Log;
	private history: Position[];

	constructor() {
		this.log = Log.getInstance();
		this.history = [];
	}

	push(position: Position | undefined = undefined): Position {
		if (position == undefined) {
			position = new Position();
		}
		this.history.push(position);
		return position;
	}

	pop(): Position | undefined {
		const position = this.history.pop();
		if (!position) {
			const msg: string = 'End of History.';
			this.log.warn(msg);
			vscode.window.showInformationMessage(msg);
		}
		return position;
	}
}