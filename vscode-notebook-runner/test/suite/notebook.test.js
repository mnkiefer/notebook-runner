const assert = require('assert');
const fs = require('fs');
const fsp = require('fs').promises;
const os = require('os');
const path = require('path');
const vscode = require('vscode');

const { describe, it } = require('mocha');

const sleep = async (time) => new Promise(r => setTimeout(r, time));

const inputs = {
    NOTEBOOK_FILE_EXT: process.env.NOTEBOOK_FILE_EXT,
    ARTIFACTS_KIND: process.env.ARTIFACTS_KIND
}

describe('Notebook Integration Testing', () => {
    let tempFolder;
    let outDir = '../data/out';
    let failedNotebooks = [];
    let failCount = 0;

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

    after(async () => {
        if (failCount > 0) {
            let comment = '';
            const icon = ':boom:'
            const getDetails = ({ nb, cell, output }) => {
                output = output.replace(/\n{2,}/g, '\n');
                return `- **${nb}** at cell ${cell}:\n<pre><code>${output}</code></pre>\n`;
            };
                
            if (failCount === 1) {
                comment = `### ${icon} 1 Notebook failed:\n\n`;
                comment += getDetails(failedNotebooks[0]);
            } else {
                comment = `### ${icon} ${failCount} Notebooks failed:\n\n`;
                failedNotebooks.forEach((nb, i) => {
                    comment += getDetails(failedNotebooks[i]);
                });
            }
            await fsp.writeFile(path.join(__dirname, outDir, 'comment.md'), comment, "utf8");
        }
    })

    const notebooks = fs.readdirSync(path.join(__dirname, '../data'));
    notebooks.filter(nb => nb.endsWith(inputs.NOTEBOOK_FILE_EXT)).forEach(function(nb) {

      it(`Running all cells in ${nb}`, async function () {

        const destnbPath = path.join(tempFolder, nb);
        const srcnbPath = path.join(__dirname, '../data', nb);
        const nbUri = vscode.Uri.file(destnbPath);
        await vscode.workspace.fs.copy(vscode.Uri.file(srcnbPath), nbUri);

        const notebook = await vscode.workspace.openNotebookDocument(nbUri);
        const getOutput = (index) => notebook.cellAt(index).outputs[0].items[0].data.toString().trim();

        await vscode.window.showNotebookDocument(notebook);
        await vscode.commands.executeCommand('notebook.execute');
        await vscode.workspace.saveAll();

        await fsp.mkdir(path.join(__dirname, outDir), { recursive: true }).catch((err) => console.log(err));
        if (inputs.ARTIFACTS_KIND === 'folder') {
            const srcnbPathUri = vscode.Uri.file(tempFolder);
            const destnbPathUri = vscode.Uri.file(path.join(__dirname, outDir, 'test_' + nb.replace(`.${inputs.NOTEBOOK_FILE_EXT}`, '')));
            await vscode.workspace.fs.copy(srcnbPathUri, destnbPathUri, { overwrite: true });
        } else if (inputs.ARTIFACTS_KIND === 'file') {
            await vscode.workspace.fs.copy(nbUri, vscode.Uri.file(path.join(__dirname, outDir, nb)), { overwrite: true });
        }

        let codeCellCount = 0;
        for (let i=0; i<notebook.cellCount; i++) {
            const kind = notebook.cellAt(i).kind;
            if (kind === 2) {
                codeCellCount++;
                const success = inputs.NOTEBOOK_FILE_EXT === 'ipynb' ? notebook.cellAt(i).outputs[0].output_type != "error" :
                    notebook.cellAt(i).executionSummary.success;
                if (!success) {
                    failedNotebooks.push({ nb, cell: codeCellCount, output: getOutput(i) });
                    failCount++;
                    break;
                }
            }
        }

        assert.equal(failedNotebooks.length === 0, true);

      });
    })
});
