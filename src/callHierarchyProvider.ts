import * as vscode from 'vscode';
import { QueryItem } from './queryItem';
import { Query } from './query';

export class CallHierarchyProvider implements vscode.CallHierarchyProvider {
	prepareCallHierarchy(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.CallHierarchyItem | undefined {
		const range = document.getWordRangeAtPosition(position);
		if (!range) {
			return undefined;
		}
		const word = document.getText(range);
		return new vscode.CallHierarchyItem(vscode.SymbolKind.Function, word, '', document.uri, range, range);
	}

	private getCallHierarchy<T>(results: QueryItem[], type: (new (item: vscode.CallHierarchyItem, fromRanges: vscode.Range[]) => T)): T[] {
		let items: T[] = [];
		for (let result of results) {
			const offset = vscode.workspace.rootPath ? vscode.workspace.rootPath.length + 1 : 0;
			const uri = result.getUri();
			const range = result.getRange();
			const name = result.getFunction();
			const detail = uri.fsPath.substring(offset) + ':' + range.start.line.toString() + ':' + range.start.character.toString();
			const callHierarchyItem = new vscode.CallHierarchyItem(vscode.SymbolKind.Function, name, detail, uri, range, range);
			const item = new type(callHierarchyItem, [range]);
			items.push(item);
		}
		return items;
	}

	async provideCallHierarchyOutgoingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyOutgoingCall[] | undefined> {
		const cscopeQuery = new Query('callee', item.name);
		await cscopeQuery.query();
		await cscopeQuery.wait();
		return this.getCallHierarchy(cscopeQuery.getResults(), vscode.CallHierarchyOutgoingCall);
	}

	async provideCallHierarchyIncomingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyIncomingCall[]> {
		const cscopeQuery = new Query('caller', item.name);
		await cscopeQuery.query();
		await cscopeQuery.wait();
		return this.getCallHierarchy(cscopeQuery.getResults(), vscode.CallHierarchyIncomingCall);
	}
}