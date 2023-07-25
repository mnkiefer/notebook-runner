const { describe, it } = require('mocha');
const assert = require('assert');

const fs = require('fs');
const fsp = require('fs').promises;
const os = require('os');
const path = require('path');

const vscode = require('vscode');

const sleep = async (time) => new Promise(r => setTimeout(r, time));

const languages = {
    ".js": "javascript",
    ".json": "json",
    ".cds": "cds",
    ".csv": "csv (semicolon)",
    ".sh": "shell",
    ".cmd": "shellscript",
    ".html": "html"
}
const codeTypes = Object.fromEntries(Object.entries(languages).map(([key, value]) => [value, key]));

describe('Notebook Integration Testing', () => {
    let tempFolder;

    beforeEach(async () => {
        tempFolder = await fsp.mkdtemp(path.join(os.tmpdir(), path.basename(__filename)) + '-');
        await vscode.commands.executeCommand('workbench.action.closeAllGroups');
    });

    afterEach(async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllGroups');
        await vscode.commands.executeCommand('workbench.action.terminal.killAll');
        await sleep(4000); // give terminal a chance to close
        await vscode.workspace.fs.delete(vscode.Uri.file(tempFolder), { recursive: true });
    });

    const notebooks = fs.readdirSync(path.join(__dirname, '../data'));
    let nbId = 0;
    notebooks.filter(nb => nb.endsWith('<NOTEBOOK_FILE_EXT>')).forEach(function(nb) {
      it(`Running all cells in ${nb}`, async function () {

        const destnbPath = path.join(tempFolder, nb);
        const srcnbPath = path.join(__dirname, '../data', nb);
        const nbUri = vscode.Uri.file(destnbPath);
        await vscode.workspace.fs.copy(vscode.Uri.file(srcnbPath), nbUri);

        const notebook = await vscode.workspace.openNotebookDocument(nbUri);
        await vscode.window.showNotebookDocument(notebook);

        await vscode.commands.executeCommand('notebook.execute');

        const getOutput = (index) => {
            if (notebook.cellAt(index).outputs[0] && notebook.cellAt(index).outputs[0].items[0]) {
                return notebook.cellAt(index).outputs[0].items[0].data.toString();
            }
        }
        let md = '';
        let comment = '### :boom: Broken Notebooks found!\n\n';
        let failed = false;
        let dataDir = '../data';
        for (let i=0; i<notebook.cellCount; i++) {
            let output = getOutput(i) || ''
            const kind = notebook.cellAt(i).kind;
            const REGEX_STYLES = /<style>(.*?\n)+<\/style>/gm;
            const success = notebook.cellAt(i).executionSummary.success;
            switch (kind) {
                case 2:
                    const lang = notebook.cellAt(i).document.languageId;
                    const codeExt = codeTypes[lang];
                    const codeType = codeExt ? codeExt.replace('.', '') : 'sh';

                    const code = notebook.cellAt(i).document.getText().replace(REGEX_STYLES, '');
                    output = output.replace(REGEX_STYLES, '').trim();
                    const icon = success ? '✓' : '⨯';
                    if (code) {
                        const codeString = `<pre lang="${codeType}">▶️  <code><b>${code}</b></code></pre>`;
                        md += `${codeString}\n`;
                        if (!success) {
                            comment += `- In Notebook <a href="'<REF_SUMMARY>'#nb-${nbId}">${nb}</a>:\n\n  ${codeString}\n\n`;
                        }
                    }
                    if (output) {
                        const outputString = `<pre>${icon}  <code><i>${output}</i></code></pre>`;
                        md += `${outputString}\n`;
                        if (!success) {
                            comment += `  ${outputString}\n\n\n`;
                            break;
                        }
                    }
                    break;
                default:
                    const text = notebook.cellAt(i).document.getText().replace(REGEX_STYLES, '');
                    md += text;
                    break;
            }
            if (!success) {
                failed = true;
                dataDir = '../data/failed';
                await fsp.mkdir(path.join(__dirname, dataDir));
                // Prepare PR comment that notebooks have failed
                await fsp.writeFile(path.join(__dirname, '../comment.md'), comment, "utf8");
                break;
            }
        }

        // Prepare Markdown summaries from Notebooks
        const srcmdPath = path.join(__dirname, dataDir, nb.replace('.' + '<NOTEBOOK_FILE_EXT>', '.md'));
        await fsp.writeFile(srcmdPath, `---\n\n# [Notebook "${path.basename(srcnbPath)}":](#nb-${nbId})\n\n${md}\n\n`, "utf8");

        assert.equal(failed, false);

        nbId++;

      });
    })
});
