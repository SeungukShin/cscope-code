import * as vscode from 'vscode';
import { CscopeConfig } from './cscopeConfig';
import { CscopePosition } from './cscopePosition';
import { CscopeItem } from './cscopeItem';

class CscopeTreeItem {
	private name: string;
	private uri: vscode.Uri | undefined;
	private range: vscode.Range | undefined;
	private parent: CscopeTreeItem | undefined;
	private children: CscopeTreeItem[];

	constructor(name: string, uri: vscode.Uri | undefined = undefined, range: vscode.Range | undefined = undefined, parent: CscopeTreeItem | undefined = undefined) {
		this.name = name;
		this.uri = uri;
		this.range = range;
		this.parent = parent;
		this.children = [];
	}

	getName(): string {
		return this.name;
	}

	getUri(): vscode.Uri | undefined {
		return this.uri;
	}

	getRange(): vscode.Range | undefined {
		return this.range;
	}

	getParent(): CscopeTreeItem | undefined {
		return this.parent;
	}

	getChildren(): CscopeTreeItem[] {
		return this.children;
	}

	pushChild(child: CscopeTreeItem): void {
		this.children.push(child);
	}
}

export class CscopeTreeDataProvider implements vscode.TreeDataProvider<CscopeTreeItem> {
	private treeView: vscode.TreeView<CscopeTreeItem>;
	private items: Map<string, CscopeTreeItem>;
	private _onDidChangeTreeData = new vscode.EventEmitter<CscopeTreeItem | undefined | null>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	constructor(cscopeItems: CscopeItem[]) {
		this.treeView = vscode.window.createTreeView('cscopeOutput', {treeDataProvider: this});
		this.items = new Map<string, CscopeTreeItem>();
		this.setItems(cscopeItems);
	}

	private setItems(cscopeItems: CscopeItem[]): void {
		const offset = vscode.workspace.rootPath ? vscode.workspace.rootPath.length + 1 : 0;
		for (let item of cscopeItems) {
			const uri = item.getUri();
			const file = uri.fsPath.substring(offset);
			const range = item.getRange();
			const line = range.start.line.toString();
			const column = range.start.character.toString();
			const func = item.getFunction();
			const text = item.getLine();
			const treeItemName = func + '[' + line + ':' + column + ']' + ' ' + text.trim();
			let root = this.items.get(file);
			if (root == undefined) {
				root = new CscopeTreeItem(file, uri);
				this.items.set(file, root);
			}
			const treeItem = new CscopeTreeItem(treeItemName, uri, range, root);
			root.pushChild(treeItem);
		}
	}

	getChildren(element?: CscopeTreeItem): CscopeTreeItem[] {
		if (element == undefined) {
			return Array.from(this.items.values());
		}
		return element.getChildren();
	}

	getParent(element: CscopeTreeItem): CscopeTreeItem | undefined {
		return element.getParent();
	}

	getTreeItem(element: CscopeTreeItem): vscode.TreeItem {
		const collapsibleState = element.getChildren().length > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None;
		const treeItem = new vscode.TreeItem(element.getUri()!, collapsibleState);
		treeItem.label = element.getName();
		if (element.getChildren().length == 0) {
			treeItem.command = { title: 'go', command: 'extension.cscope-code.go', arguments: [element.getUri(), element.getRange()] };
		}
		return treeItem;
	}

	reload(cscopeItems: CscopeItem[]): void {
		this.setItems(cscopeItems);
		this._onDidChangeTreeData.fire();
		const firstItem = Array.from(this.items.values())[0];
		this.treeView.reveal(firstItem);
	}

	dispose(): void {
		this.treeView.dispose();
	}
}