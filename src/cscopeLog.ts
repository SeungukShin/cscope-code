import * as vscode from 'vscode';
import { CscopeConfig } from './cscopeConfig';

export class CscopeLog {
	private static instance: CscopeLog;
	private config: CscopeConfig; 
	private log: vscode.OutputChannel;

	private constructor() {
		this.config = CscopeConfig.getInstance();
		this.log = vscode.window.createOutputChannel('Cscope');
	}

	static getInstance(): CscopeLog {
		if (!CscopeLog.instance) {
			CscopeLog.instance = new CscopeLog();
		}
		return CscopeLog.instance;
	}

	err(msg: string): void {
		this.log.appendLine("E: " + msg);
	}

	warn(msg: string): void {
		const l = this.config.get("logLevel");
		if (l != "E") {
			this.log.appendLine("W: " + msg);
		}
	}

	info(msg: string): void {
		const l = this.config.get("logLevel");
		if (l == "I") {
			this.log.appendLine("I: " + msg);
		}
	}
}