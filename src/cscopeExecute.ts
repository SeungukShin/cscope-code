import * as vscode from 'vscode';
import * as cp from 'child_process';

export abstract class CscopeExecute {
	static async execute(command: string): Promise<{stdout: string; stderr: string}> {
		return new Promise<{stdout: string; stderr: string}>((resolve, reject) => {
			cp.exec(command, {cwd: vscode.workspace.rootPath}, (error, stdout, stderr) => {
				if (error) {
					reject({stdout, stderr});
				} else {
					resolve({stdout, stderr});
				}
			});
		});
	}
}