import * as vscode from 'vscode';

export class CscopeLog {
	private static instance: CscopeLog;
	private log: vscode.OutputChannel;

	private constructor() {
		this.log = vscode.window.createOutputChannel('Cscope');
	}

	static getInstance(): CscopeLog {
		if (!CscopeLog.instance) {
			CscopeLog.instance = new CscopeLog();
		}
		return CscopeLog.instance;
	}

	message(msg: string): void {
		this.log.appendLine(msg);
	}
}