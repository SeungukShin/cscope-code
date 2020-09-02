import * as vscode from 'vscode';
import { CscopeItem } from './cscopeItem';
import { CscopeQuery } from './cscopeQuery';

export class CscopeCallHierarchyProvider implements vscode.CallHierarchyProvider {
	prepareCallHierarchy(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.CallHierarchyItem | undefined {
		const range = document.getWordRangeAtPosition(position);
		if (!range) {
			return undefined;
		}
		const word = document.getText(range);
		return new vscode.CallHierarchyItem(vscode.SymbolKind.Function, word, '', document.uri, range, range);
	}

	private getCallHierarchy<T>(results: CscopeItem[], type: (new (item: vscode.CallHierarchyItem, fromRanges: vscode.Range[]) => T)): T[] {
		let items: T[] = [];
		for (let result of results) {
			const item = new type(result, [result.range]);
			items.push(item);
		}
		return items;
	}

	async provideCallHierarchyOutgoingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyOutgoingCall[] | undefined> {
		const cscopeQuery = new CscopeQuery('callee', item.name);
		await cscopeQuery.query();
		await cscopeQuery.wait();
		return this.getCallHierarchy(cscopeQuery.getResults(), vscode.CallHierarchyOutgoingCall);
	}

	async provideCallHierarchyIncomingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyIncomingCall[]> {
		const cscopeQuery = new CscopeQuery('caller', item.name);
		await cscopeQuery.query();
		await cscopeQuery.wait();
		return this.getCallHierarchy(cscopeQuery.getResults(), vscode.CallHierarchyIncomingCall);
	}
}