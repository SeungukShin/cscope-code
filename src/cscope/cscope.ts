import * as cp from 'child_process';
import * as rl from 'readline';
import IConfig from '../interface/iconfig';
import ILog from '../interface/ilog';
import IEnv from '../interface/ienv';
import IItem from '../interface/iitem';
import Item from './item';

const QueryType: { [key: string]: string } = Object.freeze({
	'symbol': '-0',
	'definition': '-1',
	'callee': '-2',
	'caller': '-3',
	'text': '-4',
	'egrep': '-5',
	'file': '-6',
	'include': '-7',
	'set': '-8'
});

export default class Cscope {
	/**
	 * @property {IConfig} config
	 * @property {ILog} log
	 * @property {IEnv} env
	 * @property {string} buildCmd;
	 * @property {string} queryCmd;
	 */
	private config: IConfig;
	private log: ILog;
	private env: IEnv;
	private buildCmd: string;
	private queryCmd: string;

	/**
	 * @constructor
	 * @param {IConfig} config
	 * @param {ILog} log
	 * @param {IEnv} env
	 */
	constructor(config: IConfig, log: ILog, env: IEnv) {
		this.config = config;
		this.log = log;
		this.env = env;
		this.buildCmd = '';
		this.queryCmd = '';
	}

	/**
	 * @param {string} cwd - current working directory
	 * @returns {Promise<string>}
	 */
	async build(cwd: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const cmd = this.config.get<string>('cscope');
			const db = this.config.get<string>('database');
			const buildArgs = this.config.get<string>('buildArgs');
			const args = [buildArgs, '-f', db];
			this.buildCmd = [cmd, ...args].join(' ');
			this.log.info(cmd, args, cwd);

			let out = '';
			let err = '';
			const proc = cp.spawn(cmd, args, { cwd: cwd });
			proc.stdout.on('data', (data) => {
				out = out.concat(data.toString());
			});
			proc.stderr.on('data', (data) => {
				err = err.concat(data.toString());
			});
			proc.on('error', (error) => {
				this.log.err('error:', error);
				reject(error.toString().trim());
			});
			proc.on('close', (code) => {
				if (err.length > 0) {
					this.log.err(`stderr: ${code}\n${err}`);
				}
				this.log.info(`stdout: ${code}\n${out}`);
				if (code != 0) {
					reject(err.trim());
				} else {
					resolve(out.trim());
				}
			});
		});
	}

	/**
	 * @param {string} type
	 * @param {string} word
	 * @param {string} cwd - current working directory
	 * @returns {Promise<IItem[]>}
	 */
	async query(type: string, word: string, cwd: string): Promise<IItem[]> {
		return new Promise((resolve, reject) => {
			const cmd = this.config.get<string>('cscope');
			const db = this.config.get<string>('database');
			const queryArgs = this.config.get<string>('queryArgs');
			const args = [queryArgs, '-f', db, QueryType[type], word];
			this.queryCmd = [cmd, ...args].join(' ');
			this.log.info(cmd, args, cwd);

			let results: IItem[] = [];
			let out = '';
			let err = '';
			const proc = cp.spawn(cmd, args, { cwd: cwd });
			const rline = rl.createInterface({ input: proc.stdout, terminal: false });
			rline.on('line', (line) => {
				try {
					results.push(new Item(line));
				} catch (err) {
					this.log.err(err);
					this.log.err('cannot parse:', line);
				}
				out = out.concat(line);
			});
			proc.stderr.on('data', (data) => {
				err = err.concat(data.toString());
			});
			proc.on('error', (error) => {
				this.log.err('error:', error);
				reject(error.toString().trim());
			});
			proc.on('close', (code) => {
				if (err.length > 0) {
					this.log.err(`stderr: ${code}\n${err}`);
				}
				this.log.info(`stdout: ${code}\n${out}`);
				if (code != 0) {
					reject(err.trim());
				} else {
					this.log.info('results:', results);
					resolve(results);
				}
			});
		});
	}

	/**
	 * @returns {string}
	 */
	getBuildCmd(): string {
		return this.buildCmd;
	}

	/**
	 * @returns {string}
	 */
	getQueryCmd(): string {
		return this.queryCmd;
	}
}
