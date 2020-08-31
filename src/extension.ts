import * as vscode from 'vscode';
import * as path from 'path';
import { CscopeExecute } from './cscopeExecute';
import { CscopeConfig } from './cscopeConfig';
import { CscopeLog } from './cscopeLog';
import { CscopeHistory } from './cscopeHistory';
import { CscopeQuery } from './cscopeQuery';

export class Cscope implements vscode.DefinitionProvider, vscode.ReferenceProvider, vscode.CallHierarchyProvider {
	private config: CscopeConfig;
	private log: CscopeLog;
	private cscopeQuery: CscopeQuery;
	private history: CscopeHistory;
	private fswatcher: vscode.FileSystemWatcher | undefined;
	private callHierarchy: vscode.Disposable | undefined;
	private definitions: vscode.Disposable | undefined;
	private references: vscode.Disposable | undefined;

	constructor(context: vscode.ExtensionContext) {
		this.config = CscopeConfig.getInstance();
		this.log = CscopeLog.getInstance();
		this.cscopeQuery = new CscopeQuery('', '');
		this.history = new CscopeHistory();
		this.callHierarchy = undefined;
		this.definitions = undefined;
		this.references = undefined;

		// Check Auto Build Configuration
		if (this.config.get('auto')) {
			const root = vscode.workspace.rootPath ? vscode.workspace.rootPath : '';
			const database = path.posix.join(root, this.config.get('database'));
			const db = vscode.Uri.file(database);

			try {
				vscode.workspace.fs.stat(db).then((stat) => {
					const msg: string = '"' + db + '"' + ' exists.';
					this.log.info(msg);
				}, (stat) => {
					const msg: string = '"' + db + '"' + ' does not exist.';
					this.log.info(msg);
					this.build();
				});
			} catch {
				const msg: string = 'Exception occured while checking "' + db + '".';
				this.log.err(msg);
				vscode.window.showInformationMessage(msg);
				this.build();
			}
			this.buildAuto();
		}

		// Register Configuration Watcher
		context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
			this.config.reload();
			if (e.affectsConfiguration('cscopeCode.auto') || e.affectsConfiguration('cscopeCode.extensions')) {
				this.buildAuto();
			}
			if (e.affectsConfiguration('cscopeCode.callHierarchy')) {
				if (this.config.get('callHierarchy')) {
					this.callHierarchy = vscode.languages.registerCallHierarchyProvider('c', this);
				} else {
					this.callHierarchy?.dispose();
					this.callHierarchy = undefined;
				}
			}
			if (e.affectsConfiguration('cscopeCode.definitions')) {
				if (this.config.get('definitions')) {
					this.definitions = vscode.languages.registerDefinitionProvider('c', this);
				} else {
					this.definitions?.dispose();
					this.definitions = undefined;
				}
			}
			if (e.affectsConfiguration('cscopeCode.references')) {
				if (this.config.get('references')) {
					this.references = vscode.languages.registerReferenceProvider('c', this);
				} else {
					this.references?.dispose();
					this.references = undefined;
				}
			}
		}));

		// Register Commands
		context.subscriptions.push(vscode.commands.registerCommand('extension.cscope-code.build', () => this.build()));
		context.subscriptions.push(vscode.commands.registerCommand('extension.cscope-code.symbol', () => this.query('symbol', false)));
		context.subscriptions.push(vscode.commands.registerCommand('extension.cscope-code.symbol.input', () => this.query('symbol', true)));
		context.subscriptions.push(vscode.commands.registerCommand('extension.cscope-code.definition', () => this.query('definition', false)));
		context.subscriptions.push(vscode.commands.registerCommand('extension.cscope-code.definition.input', () => this.query('definition', true)));
		context.subscriptions.push(vscode.commands.registerCommand('extension.cscope-code.callee', () => this.query('callee', false)));
		context.subscriptions.push(vscode.commands.registerCommand('extension.cscope-code.callee.input', () => this.query('callee', true)));
		context.subscriptions.push(vscode.commands.registerCommand('extension.cscope-code.caller', () => this.query('caller', false)));
		context.subscriptions.push(vscode.commands.registerCommand('extension.cscope-code.caller.input', () => this.query('caller', true)));
		context.subscriptions.push(vscode.commands.registerCommand('extension.cscope-code.text', () => this.query('text', false)));
		context.subscriptions.push(vscode.commands.registerCommand('extension.cscope-code.text.input', () => this.query('text', true)));
		context.subscriptions.push(vscode.commands.registerCommand('extension.cscope-code.egrep', () => this.query('egrep', false)));
		context.subscriptions.push(vscode.commands.registerCommand('extension.cscope-code.egrep.input', () => this.query('egrep', true)));
		context.subscriptions.push(vscode.commands.registerCommand('extension.cscope-code.file', () => this.query('file', false)));
		context.subscriptions.push(vscode.commands.registerCommand('extension.cscope-code.file.input', () => this.query('file', true)));
		context.subscriptions.push(vscode.commands.registerCommand('extension.cscope-code.include', () => this.query('include', false)));
		context.subscriptions.push(vscode.commands.registerCommand('extension.cscope-code.include.input', () => this.query('include', true)));
		context.subscriptions.push(vscode.commands.registerCommand('extension.cscope-code.set', () => this.query('set', false)));
		context.subscriptions.push(vscode.commands.registerCommand('extension.cscope-code.set.input', () => this.query('set', true)));
		context.subscriptions.push(vscode.commands.registerCommand('extension.cscope-code.result', () => this.cscopeQuery.quickPick()));
		context.subscriptions.push(vscode.commands.registerCommand('extension.cscope-code.pop', () => this.pop()));

		// Register Providers
		if (this.config.get('callHierarchy')) {
			this.callHierarchy = vscode.languages.registerCallHierarchyProvider('c', this);
		}
		if (this.config.get('definitions')) {
			this.definitions = vscode.languages.registerDefinitionProvider('c', this);
		}
		if (this.config.get('references')) {
			this.references = vscode.languages.registerReferenceProvider('c', this);
		}
	}

	dispose(): void {
		this.fswatcher?.dispose();
		this.fswatcher = undefined;
		this.callHierarchy?.dispose();
		this.callHierarchy = undefined;
		this.definitions?.dispose();
		this.definitions = undefined;
		this.references?.dispose();
		this.references = undefined;
	}

	private async build(): Promise<void> {
		const cmd: string = this.config.get('cscope') + ' ' + this.config.get('buildArgs') + ' -f ' + this.config.get('database');
		this.log.info(cmd);
		const prog = vscode.window.setStatusBarMessage('Building "' + this.config.get('database') + '"...');
		try {
			let {stdout, stderr} = await CscopeExecute.exec(cmd);
			const msg: string = '"' + this.config.get('database') + '" is updated.'
			this.log.info(msg);
			vscode.window.setStatusBarMessage(msg, 5000);
		} catch ({stdout, stderr}) {
			const msg: string = 'Error occurred while updating "' + this.config.get('database') + '".'
			this.log.err(msg);
			vscode.window.showInformationMessage(msg);
			this.log.err(stderr);
		}
		prog.dispose();
	}

	private buildAuto(): void {
		if (this.fswatcher != undefined) {
			this.fswatcher.dispose();
			this.fswatcher = undefined;
		}
		if (this.config.get('auto')) {
			const root = vscode.workspace.rootPath ? vscode.workspace.rootPath : '';
			const pattern: string = path.posix.join(root, '**/*.{' + this.config.get('extensions') + '}');
			this.log.info('Register Auto Build Pattern: "' + pattern + '"');
			this.fswatcher = vscode.workspace.createFileSystemWatcher(pattern);
			this.fswatcher.onDidChange(() => this.build());
			this.fswatcher.onDidCreate(() => this.build());
			this.fswatcher.onDidDelete(() => this.build());
		}
	}

	private findWord(): string {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			const msg: string = 'Cannot find Active Text Editor.';
			this.log.err(msg);
			vscode.window.showInformationMessage(msg);
			return '';
		}
		const document = editor.document;
		const selection = editor.selection;
		if (!selection.isEmpty) {
			return document.getText(selection);
		}
		const range = document.getWordRangeAtPosition(selection.active);
		if (!range) {
			return '';
		}
		return document.getText(range);
	}

	pop(): void {
		const position = this.history.pop();
		position?.go();
	}

	private async query(option: string, input: boolean): Promise<void> {
		let word: string | undefined = this.findWord();
		if (input) {
			word = await vscode.window.showInputBox({value: word});
		}
		if (!word) {
			const msg: string = 'Cannot get pattern from the input box.';
			this.log.err(msg);
			vscode.window.showInformationMessage(msg);
			return;
		}
		this.cscopeQuery = new CscopeQuery(option, word);
		await this.cscopeQuery.query();
		const position = await this.cscopeQuery.quickPick();
		if (position != undefined) {
			this.history.push();
			position.go();
		}
	}

	prepareCallHierarchy(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.CallHierarchyItem | undefined {
		const range = document.getWordRangeAtPosition(position);
		if (!range) {
			return undefined;
		}
		const word = document.getText(range);
		return new vscode.CallHierarchyItem(vscode.SymbolKind.Function, word, '', document.uri, range, range);
	}

	async provideCallHierarchyOutgoingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyOutgoingCall[] | undefined> {
		this.cscopeQuery = new CscopeQuery('callee', item.name);
		await this.cscopeQuery.query();
		return this.cscopeQuery.getCallHierarchy(vscode.CallHierarchyOutgoingCall);
	}

	async provideCallHierarchyIncomingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyIncomingCall[]> {
		this.cscopeQuery = new CscopeQuery('caller', item.name);
		await this.cscopeQuery.query();
		return this.cscopeQuery.getCallHierarchy(vscode.CallHierarchyIncomingCall);
	}

	async provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Location[]> {
		this.cscopeQuery = new CscopeQuery('definition', this.findWord());
		await this.cscopeQuery.query();
		return this.cscopeQuery.getLocations();
	}

	async provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext, token: vscode.CancellationToken): Promise<vscode.Location[]> {
		this.cscopeQuery = new CscopeQuery('symbol', this.findWord());
		await this.cscopeQuery.query();
		return this.cscopeQuery.getLocations();
	}
}

let cscope: Cscope | undefined;

export function activate(context: vscode.ExtensionContext): void {
	cscope = new Cscope(context);
	console.log('"cscope-code" is now active!');
}

export function deactivate(): void {
	if (cscope) {
		cscope.dispose();
		cscope = undefined;
	}
	console.log('"cscope-code" is now inactive!');
}