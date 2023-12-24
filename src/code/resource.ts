import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { assert } from 'console';
import IResource from '../interface/iresource';

interface Resources {
	[id: string]: vscode.Uri;
}

export default class Resource implements IResource {
	/**
	 * @property {Resource} instance - instance
	 * @property {vscode.Uri} base - extention base uri
	 * @property {Resources} resources
	 * @property {vscode.Uri} filetype_c
	 * @property {vscode.Uri} filetype_cc
	 * @property {vscode.Uri} filetype_h
	 * @property {vscode.Uri} filetype_hh
	 */
	private static instance: Resource;
	private static base: vscode.Uri;
	private static resources: Resources;
	private static filetype_c: vscode.Uri;
	private static filetype_cc: vscode.Uri;
	private static filetype_h: vscode.Uri;
	private static filetype_hh: vscode.Uri;

	/**
	 * @constructor
	 * @param {vscode.Uri} base
	 */
	private constructor(base: vscode.Uri) {
		if (!Resource.instance) {
			Resource.instance = this;
			Resource.base = base;
			Resource.resources = {};
			fs.readdirSync(vscode.Uri.joinPath(base, 'resources').fsPath).forEach(file => {
				const ext = path.extname(file);
				const name = path.basename(file, ext);
				Resource.resources[name] = vscode.Uri.joinPath(base, 'resources', file);
			});
		}
		return Resource.instance;
	}

	/**
	 * Get the resource
	 * @param {vscode.Uri} base
	 * @returns {Resource}
	 */
	static getInstance(base: vscode.Uri): Resource {
		if (!Resource.instance) {
			new Resource(base);
		}
		return Resource.instance;
	}

	/**
	 * Set resource
	 * @param {string} id
	 * @param {vscode.Uri} resource
	 * @returns {void}
	 */
	set(id: string, resource: vscode.Uri): void {
		Resource.resources[id] = resource;
	}

	/**
	 * Get a resource uri.
	 * @param {string} id
	 * @returns {vscode.Uri | undefined}
	 */
	get(id: string): vscode.Uri | undefined {
		return Resource.resources[id];
	}
}