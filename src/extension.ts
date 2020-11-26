import * as vscode from 'vscode';
import * as path from 'path';
import { Execute } from './execute';
import { Config } from './config';
import { Log } from './log';
import { History } from './history';
import { Query } from './query';
import { QuickPick } from './quickPick';
import { CallHierarchyProvider } from './callHierarchyProvider';
import { DefinitionReferenceProvider } from './definitionReferenceProvider';
import { TreeDataProvider } from './treeDataProvider';

export class Cscope {
	private config: Config;
	private log: Log;
	private cscopeQuery: Query;
	private history: History;
	private fswatcher: vscode.FileSystemWatcher | undefined;
	private callHierarchy: vscode.Disposable | undefined;
	private definitions: vscode.Disposable | undefined;
	private references: vscode.Disposable | undefined;
	private treeData: TreeDataProvider | undefined;

	constructor(context: vscode.ExtensionContext) {
		this.config = Config.getInstance();
		this.log = Log.getInstance();
		this.cscopeQuery = new Query('', '');
		this.history = new History();
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
					this.callHierarchy = vscode.languages.registerCallHierarchyProvider('c', new CallHierarchyProvider());
				} else {
					this.callHierarchy?.dispose();
					this.callHierarchy = undefined;
				}
			}
			if (e.affectsConfiguration('cscopeCode.definitions')) {
				if (this.config.get('definitions')) {
					this.definitions = vscode.languages.registerDefinitionProvider('c', new DefinitionReferenceProvider());
				} else {
					this.definitions?.dispose();
					this.definitions = undefined;
				}
			}
			if (e.affectsConfiguration('cscopeCode.references')) {
				if (this.config.get('references')) {
					this.references = vscode.languages.registerReferenceProvider('c', new DefinitionReferenceProvider());
				} else {
					this.references?.dispose();
					this.references = undefined;
				}
			}
			if (e.affectsConfiguration('cscopeCode.output')) {
				if (this.config.get('output') == 'TreeView') {
					this.treeData = new TreeDataProvider(this.cscopeQuery.getResults());
				} else {
					this.treeData?.dispose();
					this.treeData = undefined;
				}
			}
		}));

		// Register Commands
		context.subscriptions.push(vscode.commands.registerCommand('cscope-code.build', () => this.build()));
		context.subscriptions.push(vscode.commands.registerCommand('cscope-code.symbol', () => this.query('symbol', false)));
		context.subscriptions.push(vscode.commands.registerCommand('cscope-code.symbol.input', () => this.query('symbol', true)));
		context.subscriptions.push(vscode.commands.registerCommand('cscope-code.definition', () => this.query('definition', false)));
		context.subscriptions.push(vscode.commands.registerCommand('cscope-code.definition.input', () => this.query('definition', true)));
		context.subscriptions.push(vscode.commands.registerCommand('cscope-code.callee', () => this.query('callee', false)));
		context.subscriptions.push(vscode.commands.registerCommand('cscope-code.callee.input', () => this.query('callee', true)));
		context.subscriptions.push(vscode.commands.registerCommand('cscope-code.caller', () => this.query('caller', false)));
		context.subscriptions.push(vscode.commands.registerCommand('cscope-code.caller.input', () => this.query('caller', true)));
		context.subscriptions.push(vscode.commands.registerCommand('cscope-code.text', () => this.query('text', false)));
		context.subscriptions.push(vscode.commands.registerCommand('cscope-code.text.input', () => this.query('text', true)));
		context.subscriptions.push(vscode.commands.registerCommand('cscope-code.egrep', () => this.query('egrep', false)));
		context.subscriptions.push(vscode.commands.registerCommand('cscope-code.egrep.input', () => this.query('egrep', true)));
		context.subscriptions.push(vscode.commands.registerCommand('cscope-code.file', () => this.query('file', false)));
		context.subscriptions.push(vscode.commands.registerCommand('cscope-code.file.input', () => this.query('file', true)));
		context.subscriptions.push(vscode.commands.registerCommand('cscope-code.include', () => this.query('include', false)));
		context.subscriptions.push(vscode.commands.registerCommand('cscope-code.include.input', () => this.query('include', true)));
		context.subscriptions.push(vscode.commands.registerCommand('cscope-code.set', () => this.query('set', false)));
		context.subscriptions.push(vscode.commands.registerCommand('cscope-code.set.input', () => this.query('set', true)));
		context.subscriptions.push(vscode.commands.registerCommand('cscope-code.result', () => this.quickPick()));
		context.subscriptions.push(vscode.commands.registerCommand('cscope-code.pop', () => this.pop()));
		context.subscriptions.push(vscode.commands.registerCommand('cscope-code.go', (uri, range) => this.go(uri, range)));

		// Register Providers
		if (this.config.get('callHierarchy')) {
			this.callHierarchy = vscode.languages.registerCallHierarchyProvider('c', new CallHierarchyProvider());
		}
		if (this.config.get('definitions')) {
			this.definitions = vscode.languages.registerDefinitionProvider('c', new DefinitionReferenceProvider());
		}
		if (this.config.get('references')) {
			this.references = vscode.languages.registerReferenceProvider('c', new DefinitionReferenceProvider());
		}

		// Create View
		if (this.config.get('output') == 'TreeView') {
			this.treeData = new TreeDataProvider(this.cscopeQuery.getResults());
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
		this.treeData?.dispose();
		this.treeData = undefined;
	}

	private async build(): Promise<void> {
		const cmd: string = this.config.get('cscope') + ' ' + this.config.get('buildArgs') + ' -f ' + this.config.get('database');
		this.log.info(cmd);
		const prog = vscode.window.setStatusBarMessage('Building "' + this.config.get('database') + '"...');
		try {
			let {stdout, stderr} = await Execute.exec(cmd);
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
		this.cscopeQuery = new Query(option, word);
		await this.cscopeQuery.query();
		await this.cscopeQuery.wait();
		if (this.config.get('output') == 'QuickPick') {
			const quickPick = new QuickPick(this.cscopeQuery.getResults());
			const position = await quickPick.show();
			if (position != undefined) {
				this.history.push();
				position.go();
			}
		} else {
			this.treeData?.reload(this.cscopeQuery.getResults());
		}
	}

	async quickPick(): Promise<void> {
		const quickPick = new QuickPick(this.cscopeQuery.getResults());
		const position = await quickPick.show();
		if (position != undefined) {
			this.history.push();
			position.go();
		}
	}

	pop(): void {
		const position = this.history.pop();
		position?.go();
	}

	async go(uri: vscode.Uri, range: vscode.Range): Promise<void> {
		return new Promise<void>(async (resolve, reject) => {
			this.history.push();
			// open a document
			vscode.workspace.openTextDocument(uri).then((f: vscode.TextDocument) => {
				let option: vscode.TextDocumentShowOptions = {
					preserveFocus: false,
					preview: false,
					selection: range,
					viewColumn: vscode.ViewColumn.Active
				};
				// open an editor
				vscode.window.showTextDocument(f, option).then((e: vscode.TextEditor) => {
					resolve();
				}), ((error: any) => {
					const msg: string = 'Cannot show "' + uri + '".';
					this.log.err(msg);
					vscode.window.showInformationMessage(msg);
					reject();
				});
			}), ((error: any) => {
				const msg: string = 'Cannot open "' + uri + '".';
				this.log.err(msg);
				vscode.window.showInformationMessage(msg);
				reject(undefined);
			});
		});
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