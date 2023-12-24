import * as vscode from 'vscode';
import * as path from 'path';
import IEnv from '../interface/ienv';
import IResource from '../interface/iresource';
import IEditor from '../interface/ieditor';
import { FilePosition } from '../interface/position';
import IItem from '../interface/iitem';
import IFileSelectList from '../interface/ifile-select-list';

const IconMap: { [key: string]: string } = Object.freeze({
	'.c': 'file_type_c',
	'.cc': 'file_type_cpp',
	'.cpp': 'file_type_cpp',
	'.h': 'file_type_cheader',
	'.hh': 'file_type_cppheader',
	'.hpp': 'file_type_cppheader'
});

class FileSelectListItem implements vscode.QuickPickItem {
	/**
	 * @property {string} file
	 * @property {number} line
	 * @property {string} label
	 * @property {string} detail
	 * @property {vscode.Uri | { light: vscode.Uri, dark: vscode.Uri } | vscode.ThemeIcon | undefined} iconPath
	 */
	private file: string;
	private line: number;
	public label: string;
	public detail: string;
	public iconPath: vscode.Uri | { light: vscode.Uri, dark: vscode.Uri } | vscode.ThemeIcon | undefined;

	/**
	 * @constructor
	 * @param {IResource} res
	 * @param {string} file
	 * @param {number} line
	 * @param {string} label
	 * @param {string} detail
	 */
	constructor(res: IResource, file: string, line: number, label: string, detail: string) {
		this.file = file;
		this.line = line;
		this.label = `${label}: ${detail}`;
		const ext = path.extname(file).toLowerCase();
		this.iconPath = res.get(IconMap[ext]);
		if (!this.iconPath) {
			this.iconPath = vscode.ThemeIcon.File;
		}
		this.detail = `${file}: ${line}`;
	}

	/**
	 * Get the file name
	 * @returns {string}
	 */
	getFile(): string {
		return this.file;
	}

	/**
	 * Get the line number
	 * @returns {number}
	 */
	getLine(): number {
		return this.line;
	}
}

export default class FileSelectList implements IFileSelectList {
	/**
	 * @property {IEnv} env
	 * @property {IResource} res
	 * @property {vscode.QuickPick} quickPick
	 * @property {string} word
	 * @property {string} cwd
	 * @property {boolean} previewOption
	 * @property {IEditor | undefined} previewEditor
	 * @property {(value: boolean) => void} resolve
	 * @property {(reason: string) => void} reject
	 */
	private env: IEnv;
	private res: IResource;
	private quickPick: vscode.QuickPick<FileSelectListItem>;
	private word: string;
	private cwd: string;
	private previewOption: boolean;
	private previewEditor: IEditor | undefined;
	private resolve: ((value: boolean) => void) | undefined;
	private reject: ((reason: string) => void) | undefined;

	/**
	 * @constructor
	 * @param {IEnv} env
	 * @param {IResource} res
	 * @param {IItem[]} items
	 * @param {string} word
	 * @param {string} cwd
	 * @param {boolean} preview
	 */
	constructor(env: IEnv, res: IResource, items: IItem[], word: string, cwd: string, preview: boolean) {
		this.env = env;
		this.res = res;
		this.word = word;
		this.cwd = cwd;
		this.previewOption = preview;
		this.previewEditor = undefined;
		this.resolve = undefined;
		this.reject = undefined;
		this.quickPick = vscode.window.createQuickPick<FileSelectListItem>();
		this.quickPick.items = this.convert(items);
	}

	/**
	 * Destroy
	 * @returns {void}
	 */
	destroy(): void {
		this.quickPick.hide();
		this.quickPick.dispose();
	}

	/**
	 * Update items on the file select list
	 * @param {IItem[]} items
	 * @returns {FileSelectListItem[]}
	 */
	private convert(items: IItem[]): FileSelectListItem[] {
		const listItems: FileSelectListItem[] = [];
		for (const item of items) {
			const listItem = new FileSelectListItem(this.res, item.getFile(), item.getLine(), item.getFunction(), item.getText());
			listItems.push(listItem);
		}
		return listItems;
	}

	/**
	 * Update items on the file select list
	 * @param {IItem[]} items
	 * @param {string} word
	 * @param {string} cwd
	 * @returns {void}
	 */
	update(items: IItem[], word: string, cwd: string): void {
		this.word = word;
		this.cwd = cwd;
		this.quickPick.items = this.convert(items);
	}

	/**
	 * Show the file select list
	 * @returns {Promise<boolean>}
	 */
	async show(): Promise<boolean> {
		return new Promise((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
			this.quickPick.onDidAccept(() => this.select());
			this.quickPick.onDidHide(() => this.hide());
			this.quickPick.onDidChangeActive(() => this.preview());
			this.quickPick.show();
		});
	}

	/**
	 * Hide the file select list
	 * @returns {Promise<void>}
	 */
	async hide(): Promise<void> {
		this.quickPick.hide();
		if (this.reject) {
			this.reject('cancelled');
			this.resolve = undefined;
			this.reject = undefined;
		}
		this.previewEditor?.close();
		this.previewEditor = undefined;
	}

	/**
	 * Open a preview editor
	 * @returns {Promise<void>}
	 */
	async preview(): Promise<void> {
		if (!this.previewOption) {
			return;
		}
		const item = this.quickPick.activeItems[0];
		if (!item) {
			return;
		}
		const file = item.getFile();
		const uri = path.isAbsolute(file) ? file : path.join(this.cwd, file);
		const position = new FilePosition(uri, item.getLine(), 0);
		const editor = await this.env.open(position, true);
		this.previewEditor = editor;
	}

	/**
	 * Execute an action when the item is selected
	 * @returns {Promise<void>}
	 */
	async select(): Promise<void> {
		if (!this.resolve) {
			return;
		}
		const item = this.quickPick.selectedItems[0];
		if (!item) {
			return;
		}
		const file = item.getFile();
		const uri = path.isAbsolute(file) ? file : path.join(this.cwd, file);
		const line = item.getLine();
		const position = new FilePosition(uri, line, 0);
		const editor = await this.env.open(position, false);
		const text = editor.getTextLine(line);
		const column = text?.indexOf(this.word);
		if (column && column > 0) {
			editor.setCurosr(line, column);
		}
		if (this.resolve) {
			this.resolve(true);
		}
		this.resolve = undefined;
		this.reject = undefined;
	}
}
