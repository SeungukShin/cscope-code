import * as vscode from 'vscode';

export default interface IResource {
	/**
	 * Set resource
	 * @param {string} id
	 * @param {vscode.Uri} resource
	 * @returns {void}
	 */
	set(id: string, resource: vscode.Uri): void;

	/**
	 * Get a resource uri.
	 * @param {string} id
	 * @returns {vscode.Uri | undefined}
	 */
	get(id: string): vscode.Uri | undefined;
}
