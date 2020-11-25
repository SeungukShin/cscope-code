import * as vscode from 'vscode';
import * as path from 'path';
import { Config } from './config';
import { Position } from './position';
import { QueryItem } from './queryItem';

class QuickPickItem implements vscode.QuickPickItem {
	private position: Position;
	label: string;
	detail: string;

	constructor(position: Position, label: string, detail: string) {
		this.position = position;
		this.label = label;
		this.detail = detail;
	}

	getPosition(): Position {
		return this.position;
	}
}

export class QuickPick {
	private config: Config;
	private preview: vscode.TextEditor | undefined;
	private items: QuickPickItem[];
	private quickPick: vscode.QuickPick<QuickPickItem>;

	constructor(results: QueryItem[]) {
		this.config = Config.getInstance();
		this.items = [];
		for (let result of results) {
			const offset = vscode.workspace.rootPath ? vscode.workspace.rootPath.length + 1 : 0;
			const uri = result.getUri();
			const range = result.getRange();
			const position = new Position(uri.fsPath, range.start);
			const ext = path.extname(result.getFile());
			const icon = (ext === '.c') ? '$(symbol-method)' : (ext === '.h') ? '$(symbol-field)' : '$(symbol-file)';
			const label = icon + ' ' + result.getFunction() + ' : ' + result.getLine();
			const detail = uri.fsPath.substring(offset) + ':' + range.start.line.toString() + ':' + range.start.character.toString();
			const cscopeQuickPickItem = new QuickPickItem(position, label, detail);
			this.items.push(cscopeQuickPickItem);
		}
		this.quickPick = vscode.window.createQuickPick<QuickPickItem>();
		this.quickPick.items = this.items;
	}

	show(): Promise<Position | undefined> {
		return new Promise<Position | undefined>((resolve, reject) => {
			this.quickPick.onDidAccept(() => {
				const item = this.quickPick.selectedItems[0];
				if (item) {
					const position = item.getPosition();
					resolve(position);
				}
				this.quickPick.hide();
			});
			this.quickPick.onDidHide(() => {
				if (this.preview != undefined) {
					this.preview.hide();
					this.preview = undefined;
				}
				this.quickPick.dispose();
				resolve(undefined);
			});
			if (this.config.get('preview')) {
				this.quickPick.onDidChangeActive(() => {
					const item = this.quickPick.activeItems[0];
					if (item) {
						const position = item.getPosition();
						position.go(true).then((e: vscode.TextEditor | undefined) => {
							this.preview = e;
						});
					}
				});
			}
			this.quickPick.show();
		});
	}

	hide(): void {
		this.quickPick.hide();
	}
}