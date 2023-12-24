import * as vscode from 'vscode';
import ILog from '../interface/ilog';
import IConfig from '../interface/iconfig';

export default class Log implements ILog {
	/**
	 * @property {Log} instance - instance
	 * @property {IConfig} config - config
	 * @property {vscode.LogOutputChannel} log - log output channel
	 */
	private static instance: Log;
	private static config: IConfig; 
	private static log: vscode.LogOutputChannel;

	/**
	 * @constructor
	 * @param {string} base
	 * @param {IConfig} config
	 */
	private constructor(base: string, config: IConfig) {
		if (!Log.instance) {
			Log.config = config;
			Log.log = vscode.window.createOutputChannel(base, {log: true});
			Log.instance = this;
		}
		return Log.instance;
	}

	/**
	 * Get the log
	 * @param {string} base
	 * @param {IConfig} config
	 * @returns {Log}
	 */
	static getInstance(base: string, config: IConfig): Log {
		if (!Log.instance) {
			new Log(base, config);
		}
		return Log.instance;
	}

	/**
	 * Print error message.
	 * @param {any[]} args - Objects to print.
	 * @returns {void}
	 */
	err(...args: any[]): void {
		console.log('E:', ...args);
		Log.log.error('E:', ...args);
	}

	/**
	 * Print warning message.
	 * @param {any[]} args - Objects to print.
	 * @returns {void}
	 */
	warn(...args: any[]): any {
		const l = Log.config.get('logLevel');
		if (l !== 'E') {
			console.log('W:', ...args);
			Log.log.debug('W:', ...args);
		}
	}

	/**
	 * Print information message.
	 * @param {any[]} args - Objects to print.
	 * @returns {void}
	 */
	info(...args: any[]): void {
		const l = Log.config.get('logLevel');
		if (l === 'I') {
			console.log('I:', ...args);
			Log.log.info('I:', ...args);
		}
	}
}
