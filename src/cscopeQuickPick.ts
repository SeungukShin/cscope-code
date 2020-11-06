import * as vscode from 'vscode';
import * as path from 'path';
import { CscopeConfig } from './cscopeConfig';
import { CscopePosition } from './cscopePosition';
import { CscopeItem } from './cscopeItem';

class CscopeQuickPickItem implements vscode.QuickPickItem {
	private position: CscopePosition;
	label: string;
	detail: string;

	constructor(position: CscopePosition, label: string, detail: string) {
		this.position = position;
		this.label = label;
		this.detail = detail;
	}

	getPosition(): CscopePosition {
		return this.position;
	}
}

export class CscopeQuickPick {
	private config: CscopeConfig;
	private preview: vscode.TextEditor | undefined;
	private items: CscopeQuickPickItem[];
	private quickPick: vscode.QuickPick<CscopeQuickPickItem>;

	constructor(results: CscopeItem[]) {
		this.config = CscopeConfig.getInstance();
		this.items = [];
		for (let result of results) {
			const offset = vscode.workspace.rootPath ? vscode.workspace.rootPath.length + 1 : 0;
			const uri = result.getUri();
			const range = result.getRange();
			const position = new CscopePosition(uri.fsPath, range.start);
			const ext = path.extname(result.getFile());
			const icon = (ext === '.c') ? '$(symbol-method)' : (ext === '.h') ? '$(symbol-field)' : '$(symbol-file)';
			const label = icon + ' ' + result.getFunction() + ' : ' + result.getLine();
			const detail = uri.fsPath.substring(offset) + ':' + range.start.line.toString() + ':' + range.start.character.toString();
			const cscopeQuickPickItem = new CscopeQuickPickItem(position, label, detail);
			this.items.push(cscopeQuickPickItem);
		}
		this.quickPick = vscode.window.createQuickPick<CscopeQuickPickItem>();
		this.quickPick.items = this.items;
	}

	show(): Promise<CscopePosition | undefined> {
		return new Promise<CscopePosition | undefined>((resolve, reject) => {
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