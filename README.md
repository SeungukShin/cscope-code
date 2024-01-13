# Cscope Extension for VS Code
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/SeungukShin/cscope-code/ci.yml?branch=master)
[![](https://img.shields.io/visual-studio-marketplace/v/SeungukShin.cscope-code)](https://marketplace.visualstudio.com/items?itemName=SeungukShin.cscope-code)
![install](https://img.shields.io/visual-studio-marketplace/i/SeungukShin.cscope-code)

Integrates [cscope](http://cscope.sourceforge.net) into VS Code.

![demo](https://raw.githubusercontent.com/SeungukShin/cscope-code/master/resources/demo.gif)

## Commands

| Name                      | Description                                         | Shortcut   |
|---------------------------|-----------------------------------------------------|------------|
| `Cscope Code: Build`      | builds a database of cscope.                        | `ctrl+. b` |
| `Cscope Code: Symbol`     | finds this C symbol.                                | `ctrl+. s` |
| `Cscope Code: Definition` | finds this global definition.                       | `ctrl+. g` |
| `Cscope Code: Callee`     | finds functions called by this function.            | `ctrl+. a` |
| `Cscope Code: Caller`     | finds functions calling this function.              | `ctrl+. c` |
| `Cscope Code: Text`       | finds this text string.                             | `ctrl+. t` |
| `Cscope Code: Pattern`    | finds this egrep pattern.                           | `ctrl+. e` |
| `Cscope Code: File`       | finds this file.                                    | `ctrl+. f` |
| `Cscope Code: Include`    | finds files including this file.                    | `ctrl+. i` |
| `Cscope Code: Set`        | finds places where this symbol is assigned a value. | `ctrl+. n` |
| `Cscope Code: Result`     | shows a previous result.                            | `ctrl+. .` |
| `Cscope Code: Pop`        | moves a cursor to a previous position.              | `ctrl+. o` |

## Configurations

| Name          | Description                                                              | Default     |
|---------------|--------------------------------------------------------------------------|-------------|
| cscope        | A filename of cscope executalbe file.                                    | cscope      |
| buildArgs     | Arguments to build a cscope database.                                    | -RbU        |
| queryArgs     | Arguments to query a symbol.                                             | -RdL        |
| database      | A database filename for cscope.                                          | cscope.out  |
| auto          | Generate a cscope database when open an workspace or store a file on it. | true        |
| extensions    | Extensions to monitor their changes to update database.                  | c,h         |
| preview       | Preview the result of the query.                                         | true        |
| hierarchy     | Use this extension as call hierarchy provider.                           | true        |
| definition    | Use this extension as definition provider.                               | true        |
| reference     | Use this extension as reference provider.                                | true        |
| logLevel      | Log level.                                                               | Error       |
| maxBuffer     | Max. buffer size for output from cscope in MB.                           | 10          |
| output        | Output type for cscope query result.                                     | QuickPick   |
| clearTreeView | Clear historical result in TreeView.                                     | false       |
