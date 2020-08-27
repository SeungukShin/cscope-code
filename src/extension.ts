import * as vscode from 'vscode';
import * as path from 'path';
import { CscopeExecute } from './cscopeExecute';
import { CscopeConfig } from './cscopeConfig';
import { CscopeLog } from './cscopeLog';
import { CscopePosition } from './cscopePosition';
import { CscopeHistory } from './cscopeHistory';
import { CscopeItem, CscopeQuery } from './cscopeQuery';

export class Cscope implements vscode.DefinitionProvider, vscode.ReferenceProvider, vscode.CallHierarchyProvider {
	private config: CscopeConfig;
	private log: CscopeLog;
	private queryResult: CscopeQuery;
	private history: CscopeHistory;
	private fswatcher: vscode.FileSystemWatcher | undefined;
	private preview: vscode.TextEditor | undefined;
	private option: Record<string, string> = {
		'symbol': ' -0 ',
		'definition': ' -1 ',
		'callee': ' -2 ',
		'caller': ' -3 ',
		'text': ' -4 ',
		'egrep': ' -5 ',
		'file': ' -6 ',
		'include': ' -7 ',
		'set': ' -8 '
	};
	private callHierarchy: vscode.Disposable | undefined;
	private definitions: vscode.Disposable | undefined;
	private references: vscode.Disposable | undefined;

	constructor(context: vscode.ExtensionContext) {
		this.config = CscopeConfig.getInstance();
		this.log = CscopeLog.getInstance();
		this.queryResult = new CscopeQuery('', '');
		this.history = new CscopeHistory();
		this.preview = undefined;
		this.callHierarchy = undefined;
		this.definitions = undefined;
		this.references = undefined;

		// Check Auto Build Configuration
		if (this.config.get('auto')) {
			const root = vscode.workspace.rootPath ? vscode.workspace.rootPath : '';
			const database = path.posix.join(root, this.config.get('database') || '');
			const db = vscode.Uri.file(database);

			try {
				vscode.workspace.fs.stat(db).then((stat) => {
					const msg: string = '"' + db + '"' + ' exists.';
					this.log.message(msg);
				}, (stat) => {
					const msg: string = '"' + db + '"' + ' does not exist.';
					this.log.message(msg);
					this.build();
				});
			} catch {
				const msg: string = 'Exception occured while checking "' + db + '".';
				this.log.message(msg);
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
		context.subscriptions.push(vscode.commands.registerCommand('extension.cscope-code.result', () => this.quickPick(this.queryResult)));
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

	public dispose(): void {
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
		const cmd: string = this.config.get('build') + ' -f ' + this.config.get('database');
		this.log.message(cmd);
		const prog = vscode.window.setStatusBarMessage('Building "' + this.config.get('database') + '"...');
		await CscopeExecute.execute(cmd).then(({stdout, stderr}) => {
			const msg: string = '"' + this.config.get('database') + '" is updated.'
			this.log.message(msg);
			vscode.window.setStatusBarMessage(msg, 5000);
		}, ({stdout, stderr}) => {
			const msg: string = 'Error occurred while updating "' + this.config.get('database') + '".'
			this.log.message(msg);
			vscode.window.showInformationMessage(msg);
			this.log.message(stderr);
		}).catch(({stdout, stderr}) => {
			const msg: string = 'Exception occurred while updating "' + this.config.get('database') + '".'
			this.log.message(msg);
			vscode.window.showInformationMessage(msg);
			this.log.message(stderr);
		});
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
			this.log.message('Register Auto Build Pattern: "' + pattern + '"');
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
			this.log.message(msg);
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

	private quickPick(result: CscopeQuery): void {
		if (result.getPattern() == '') {
			return;
		}
		const quickPick = vscode.window.createQuickPick<CscopeItem>();
		quickPick.items = result.getResult();
		quickPick.onDidHide(() => {
			if (this.preview != undefined) {
				this.preview.hide();
				this.preview = undefined;
			}
			quickPick.dispose();
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
		quickPick.onDidAccept(() => {
			const item: CscopeItem = quickPick.selectedItems[0];
			if (item) {
				this.history.push()
				const position = new CscopePosition(item.getFile(), item.getRange().start);
				position.go();
			}
			quickPick.hide();
		});
		quickPick.show();
	}

	private async queryPattern(option: string, pattern: string): Promise<void> {
		const cmd: string = this.config.get('query') + ' -f ' + this.config.get('database') + this.option[option] + pattern;
		this.log.message(cmd);
		const prog = vscode.window.setStatusBarMessage('Querying "' + pattern + '"...');
		let output = '';
		await CscopeExecute.execute(cmd).then(({stdout, stderr}) => {
			this.queryResult = new CscopeQuery(option, pattern);
			this.log.message(stdout);
			output = stdout;
		}, ({stdout, stderr}) => {
			const msg: string = 'Error occurred while querying: "' + cmd + '".';
			this.log.message(msg);
			vscode.window.showInformationMessage(msg);
			this.log.message(stderr);
		}).catch(({stdout, stderr}) => {
			const msg: string = 'Exception occurred while querying: "' + cmd + '".';
			this.log.message(msg);
			vscode.window.showInformationMessage(msg);
			this.log.message(stderr);
		});
		await this.queryResult.setResults(output);
		prog.dispose();
	}

	private async query(option: string, input: boolean): Promise<void> {
		let word: string | undefined = this.findWord();
		if (input) {
			word = await vscode.window.showInputBox({value: word});
		}
		if (!word) {
			const msg: string = 'Cannot get pattern from the input box.';
			this.log.message(msg);
			vscode.window.showInformationMessage(msg);
			return;
		}
		await this.queryPattern(option, word);
		this.quickPick(this.queryResult);
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
		let document = await vscode.workspace.openTextDocument(item.uri);
		let outgoingCallItems: vscode.CallHierarchyOutgoingCall[] = [];
		await this.queryPattern('callee', item.name);
		for (let result of this.queryResult.getResult()) {
			const outgo = new vscode.CallHierarchyOutgoingCall(result, [result.range]);
			outgoingCallItems.push(outgo);
		}
		return outgoingCallItems;
	}

	async provideCallHierarchyIncomingCalls(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Promise<vscode.CallHierarchyIncomingCall[]> {
		let document = await vscode.workspace.openTextDocument(item.uri);
		let incomingCallItems: vscode.CallHierarchyIncomingCall[] = [];
		await this.queryPattern('caller', item.name);
		for (let result of this.queryResult.getResult()) {
			const income = new vscode.CallHierarchyIncomingCall(result, [result.range]);
			incomingCallItems.push(income);
		}
		return incomingCallItems;
	}

	async provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Location[]> {
		let definitions: vscode.Location[] = [];
		await this.queryPattern('definition', this.findWord());
		for (let result of this.queryResult.getResult()) {
			const definition = new vscode.Location(result.getUri(), result.getRange());
			definitions.push(definition);
		}
		return definitions;
	}

	async provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext, token: vscode.CancellationToken): Promise<vscode.Location[]> {
		let references: vscode.Location[] = [];
		await this.queryPattern('symbol', this.findWord());
		for (let result of this.queryResult.getResult()) {
			const reference = new vscode.Location(result.getUri(), result.getRange());
			references.push(reference);
		}
		return references;
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