import * as vscode from 'vscode';
import { Config } from './config';

export class Log {
	private static instance: Log;
	private config: Config; 
	private log: vscode.OutputChannel;

	private constructor() {
		this.config = Config.getInstance();
		this.log = vscode.window.createOutputChannel('Cscope');
	}

	static getInstance(): Log {
		if (!Log.instance) {
			Log.instance = new Log();
		}
		return Log.instance;
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