import * as vscode from 'vscode';
import { CscopeLog } from './cscopeLog';
import { CscopePosition } from './cscopePosition';

export class CscopeHistory {
	private log: CscopeLog;
	private history: CscopePosition[];

	constructor() {
		this.log = CscopeLog.getInstance();
		this.history = [];
	}

	push(position: CscopePosition | undefined = undefined): CscopePosition {
		if (position == undefined) {
			position = new CscopePosition();
		}
		this.history.push(position);
		return position;
	}

	pop(): CscopePosition | undefined {
		const position = this.history.pop();
		if (!position) {
			const msg: string = 'End of History.';
			this.log.warn(msg);
			vscode.window.showInformationMessage(msg);
		}
		return position;
	}
}