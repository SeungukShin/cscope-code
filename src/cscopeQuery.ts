import * as vscode from 'vscode';
import * as path from 'path';
import * as rl from 'readline';
import { CscopeExecute } from './cscopeExecute';
import { CscopeConfig } from './cscopeConfig';
import { CscopeLog } from './cscopeLog';
import { CscopeItem } from './cscopeItem';
import { CscopePosition } from './cscopePosition';

export class CscopeQuery {
	private config: CscopeConfig;
	private log: CscopeLog;
	private type: string;
	private pattern: string;
	private results: CscopeItem[];
	private promiseResults: Promise<CscopeItem>[];
	private preview: vscode.TextEditor | undefined;
	private progress: vscode.Disposable | undefined;
	private option: Record<string, string> = {
		'symbol': '-0',
		'definition': '-1',
		'callee': '-2',
		'caller': '-3',
		'text': '-4',
		'egrep': '-5',
		'file': '-6',
		'include': '-7',
		'set': '-8'
	};

	constructor(type: string, pattern: string) {
		this.config = CscopeConfig.getInstance();
		this.log = CscopeLog.getInstance();
		this.type = type;
		this.pattern = pattern;
		this.results = [];
		this.promiseResults = [];
	}

	getType(): string {
		return this.type;
	}

	getPattern(): string {
		return this.pattern;
	}

	getResults(): CscopeItem[] {
		return this.results;
	}

	private getFullPath(file: string): string {
		if (path.isAbsolute(file)) {
			return file;
		}
		const root = vscode.workspace.rootPath ? vscode.workspace.rootPath : '';
		return path.posix.join(root, file);
	}

	private async setResult(line: string): Promise<CscopeItem> {
		return new Promise<CscopeItem>((resolve, rejects) => {
			// TODO: what if file name contains a space?
			// line format: (filename) (function) (line number) (content)
			const tokens = line.match(/([^ ]*) +([^ ]*) +([^ ]*) (.*)/);
			if (tokens == null || tokens.length < 5) {
				rejects();
				return;
			}
			const file = this.getFullPath(tokens[1]);
			const func = tokens[2];
			const lnum = parseInt(tokens[3]) - 1;
			const rest = tokens[4];
			let text = '';
			let cnum = 0;
			let length = 0;
			const uri = vscode.Uri.file(file);
			vscode.workspace.openTextDocument(uri).then((f) => {
				text = f.lineAt(lnum).text;
				if (this.type === 'callee') {
					cnum = text.search(func);
					length = func.length;
				} else {
					cnum = text.search(this.pattern);
						length = this.pattern.length;
				}
				if (cnum == -1) {
					// If search pattern is not found in that line, still display the result
					// Because the intended result could be shifted by a few lines due to the
					// database not being up to date.
					// TODO: should we search the whole file instead at this point?
					cnum = 0;
					length = 0;
				}
				const range = new vscode.Range(lnum, cnum, lnum, cnum + length);
				const item = new CscopeItem(uri, func, range, rest, text);
				this.results.push(item);
				resolve(item);
			}, (e) => {
				const msg: string = 'Could not open "' + file + '".';
				vscode.window.showWarningMessage(msg);
				rejects();
			});
		});
	}

	async query(): Promise<CscopeQuery> {
		return new Promise<CscopeQuery>((resolve, rejects) => {
			const cmd: string = this.config.get('cscope');
			const args: string[] = [
				this.config.get('queryArgs'),
				'-f',
				this.config.get('database'),
				this.option[this.type],
				this.pattern
			];
			if (this.progress != undefined) {
				this.progress.dispose();
			}
			this.progress = vscode.window.setStatusBarMessage('Querying "' + this.pattern + '"...');
			const proc = CscopeExecute.spawn(cmd, args);
			const rline = rl.createInterface({input: proc.stdout, terminal: false});
			rline.on('line', (line) => {
				this.promiseResults.push(this.setResult(line));
			});
			proc.stderr.on('data', (data) => {
				this.log.err(data.toString());
			});
			proc.on('error', (err) => {
				this.log.err(err.message);
				rejects();
			});
			proc.on('exit', (code, signal) => {
				resolve(this);
			});
		});
	}

	async wait(): Promise<void> {
		await Promise.all(this.promiseResults);
		if (this.progress != undefined) {
			this.progress.dispose();
			this.progress = undefined;
		}
		this.promiseResults = [];
	}

	async quickPick(): Promise<CscopePosition | undefined> {
		return new Promise<CscopePosition | undefined>((resolve, reject) => {
			if (this.pattern == '') {
				reject(undefined);
			}
			const quickPick = vscode.window.createQuickPick<CscopeItem>();
			quickPick.items = this.results;
			quickPick.onDidAccept(() => {
				const item: CscopeItem = quickPick.selectedItems[0];
				if (item) {
					const position = new CscopePosition(item.getFile(), item.getRange().start);
					resolve(position);
				}
				quickPick.hide();
			});
			quickPick.onDidHide(() => {
				if (this.preview != undefined) {
					this.preview.hide();
					this.preview = undefined;
				}
				quickPick.dispose();
				reject(undefined);
			});
			if (this.config.get('preview')) {
				quickPick.onDidChangeActive(() => {
					const item: CscopeItem = quickPick.activeItems[0];
					if (item) {
						const position = new CscopePosition(item.getFile(), item.getRange().start);
						position.go(true).then((e: vscode.TextEditor | undefined) => {
							this.preview = e;
						});
					}
				});
			}
			quickPick.show();
		});
	}
}