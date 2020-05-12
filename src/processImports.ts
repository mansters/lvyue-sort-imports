import * as vscode from 'vscode';
import * as options from './options';
import { TypescriptImport } from './TypescriptImport';
import { lvyueImportSort } from './lvyueSortUtils';

export default function processImports(
    importClauses: TypescriptImport[],
    document: vscode.TextDocument,
): TypescriptImport[] {
    const imports = importClauses
        .map(importClause => {
            if (importClause.namedImports) {
                importClause.namedImports.sort((a, b) => a.importName.localeCompare(b.importName, 'en', { sensitivity: 'base' }));
            }
            return importClause;
        });

    const result = lvyueImportSort(imports, document);

    return result;
}