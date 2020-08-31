import * as vscode from 'vscode';
import * as cp from 'child_process';
import { CscopeConfig } from './cscopeConfig';

export abstract class CscopeExecute {
	static async execute(command: string): Promise<{stdout: string; stderr: string}> {
		const config = CscopeConfig.getInstance();
		let max: number | undefined = config.get('maxBuffer');
		if (max != undefined) {
			max = max * 1024 * 1024;
		}
		return new Promise<{stdout: string; stderr: string}>((resolve, reject) => {
			cp.exec(command, {cwd: vscode.workspace.rootPath, maxBuffer: max}, (error, stdout, stderr) => {
				if (error) {
					reject({stdout, stderr});
				} else {
					resolve({stdout, stderr});
				}
			});
		});
	}
}