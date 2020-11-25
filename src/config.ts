import * as vscode from 'vscode';
import { assert } from 'console';

export class Config {
	private static instance: Config;
	private config: vscode.WorkspaceConfiguration;

	private constructor() {
		this.config = vscode.workspace.getConfiguration('cscopeCode');
	}

	static getInstance(): Config {
		if (!Config.instance) {
			Config.instance = new Config();
		}
		return Config.instance;
	}

	reload(): void {
		this.config = vscode.workspace.getConfiguration('cscopeCode');
	}

	get<T>(section: string): T {
		const value: T | undefined = this.config.get(section);
		assert(typeof value !== undefined);
		return value as T;
	}
}