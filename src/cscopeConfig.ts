import * as vscode from 'vscode';

export class CscopeConfig {
    private static instance: CscopeConfig;
    private config: vscode.WorkspaceConfiguration;

    private constructor() {
        this.config = vscode.workspace.getConfiguration('cscopeCode');
    }

    static getInstance() {
        if (!CscopeConfig.instance) {
            CscopeConfig.instance = new CscopeConfig();
        }
        return CscopeConfig.instance;
    }

    reload() {
        this.config = vscode.workspace.getConfiguration('cscopeCode');
    }

    get<T>(section: string): T | undefined {
        return this.config.get(section);
    }
}