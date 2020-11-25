import * as vscode from 'vscode';
import { Config } from './config';
import { Position } from './position';
import { QueryItem } from './queryItem';

class TreeItem {
	private name: string;
	private uri: vscode.Uri | undefined;
	private range: vscode.Range | undefined;
	private parent: TreeItem | undefined;
	private children: TreeItem[];

	constructor(name: string, uri: vscode.Uri | undefined = undefined, range: vscode.Range | undefined = undefined, parent: TreeItem | undefined = undefined) {
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

	getParent(): TreeItem | undefined {
		return this.parent;
	}

	getChildren(): TreeItem[] {
		return this.children;
	}

	pushChild(child: TreeItem): void {
		this.children.push(child);
	}
}

export class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
	private treeView: vscode.TreeView<TreeItem>;
	private items: Map<string, TreeItem>;
	private _onDidChangeTreeData = new vscode.EventEmitter<TreeItem | undefined | null>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	constructor(cscopeItems: QueryItem[]) {
		this.treeView = vscode.window.createTreeView('cscopeOutput', {treeDataProvider: this});
		this.items = new Map<string, TreeItem>();
		this.setItems(cscopeItems);
	}

	private setItems(cscopeItems: QueryItem[]): void {
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
				root = new TreeItem(file, uri);
				this.items.set(file, root);
			}
			const treeItem = new TreeItem(treeItemName, uri, range, root);
			root.pushChild(treeItem);
		}
	}

	getChildren(element?: TreeItem): TreeItem[] {
		if (element == undefined) {
			return Array.from(this.items.values());
		}
		return element.getChildren();
	}

	getParent(element: TreeItem): TreeItem | undefined {
		return element.getParent();
	}

	getTreeItem(element: TreeItem): vscode.TreeItem {
		const collapsibleState = element.getChildren().length > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None;
		const treeItem = new vscode.TreeItem(element.getUri()!, collapsibleState);
		treeItem.label = element.getName();
		if (element.getChildren().length == 0) {
			treeItem.command = { title: 'go', command: 'extension.cscope-code.go', arguments: [element.getUri(), element.getRange()] };
		}
		return treeItem;
	}

	reload(cscopeItems: QueryItem[]): void {
		this.setItems(cscopeItems);
		this._onDidChangeTreeData.fire();
		const firstItem = Array.from(this.items.values())[0];
		this.treeView.reveal(firstItem);
	}

	dispose(): void {
		this.treeView.dispose();
	}
}