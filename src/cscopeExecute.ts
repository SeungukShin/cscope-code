import * as vscode from 'vscode';
import * as cp from 'child_process';
import { CscopeConfig } from './cscopeConfig';

export abstract class CscopeExecute {
	static async exec(command: string): Promise<{stdout: string; stderr: string}> {
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

	static spawn(cmd: string, args: string[]): cp.ChildProcessWithoutNullStreams {
		return cp.spawn(cmd, args, {cwd: vscode.workspace.rootPath});
	}
}