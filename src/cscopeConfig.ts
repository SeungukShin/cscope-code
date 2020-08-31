import * as vscode from 'vscode';
import { assert } from 'console';

export class CscopeConfig {
	private static instance: CscopeConfig;
	private config: vscode.WorkspaceConfiguration;

	private constructor() {
		this.config = vscode.workspace.getConfiguration('cscopeCode');
	}

	static getInstance(): CscopeConfig {
		if (!CscopeConfig.instance) {
			CscopeConfig.instance = new CscopeConfig();
		}
		return CscopeConfig.instance;
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