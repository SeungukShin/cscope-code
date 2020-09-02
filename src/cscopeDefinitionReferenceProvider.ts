import * as vscode from 'vscode';
import { CscopeItem } from './cscopeItem';
import { CscopeQuery } from './cscopeQuery';

export class CscopeDefinitionReferenceProvider implements vscode.DefinitionProvider, vscode.ReferenceProvider {
	getLocations(results: CscopeItem[]): vscode.Location[] {
		let locations: vscode.Location[] = [];
		for (let result of results) {
			const location = new vscode.Location(result.getUri(), result.getRange());
			locations.push(location);
		}
		return locations;
	}

	async provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Location[] | undefined> {
		const range = document.getWordRangeAtPosition(position);
		if (!range) {
			return undefined;
		}
		const word = document.getText(range);
        const cscopeQuery = new CscopeQuery('definition', word);
		await cscopeQuery.query();
		await cscopeQuery.wait();
		return this.getLocations(cscopeQuery.getResults());
	}

	async provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext, token: vscode.CancellationToken): Promise<vscode.Location[] | undefined> {
		const range = document.getWordRangeAtPosition(position);
		if (!range) {
			return undefined;
		}
		const word = document.getText(range);
		const cscopeQuery = new CscopeQuery('symbol', word);
		await cscopeQuery.query();
		await cscopeQuery.wait();
		return this.getLocations(cscopeQuery.getResults());
	}
}