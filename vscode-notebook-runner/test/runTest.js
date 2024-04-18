const cp = require('child_process');
const path = require('path');

const { downloadAndUnzipVSCode, resolveCliArgsFromVSCodeExecutablePath, runTests } = require('@vscode/test-electron');

const inputs = {
  NOTEBOOK_VSCODE_EXT: process.env.NOTEBOOK_VSCODE_EXT,
  VSCODE_VERSION: process.env.VSCODE_VERSION
}

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '..');
    const extensionTestsPath = path.resolve(__dirname, './suite/index');
    const vscodeExecutablePath = await downloadAndUnzipVSCode({ version: inputs.VSCODE_VERSION });
    const [cliPath, ...args] = resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);

    for (let vscode_ext of inputs.NOTEBOOK_VSCODE_EXT.trim().split(/\s+/g)) {
      args.push('--install-extension', vscode_ext);
    }
    
    cp.spawnSync(
      cliPath,
      [...args],
      { encoding: 'utf-8', stdio: 'inherit' }
    );

    await runTests({ 
      vscodeExecutablePath, 
      extensionDevelopmentPath,
      extensionTestsPath
    });
  } catch (err) {
    console.error('Failed to run tests:');
	console.log(err);
    process.exit(1);
  }
}

main();
