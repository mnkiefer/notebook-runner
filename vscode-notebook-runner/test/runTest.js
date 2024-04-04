const cp = require('child_process');
const path = require('path');

const { downloadAndUnzipVSCode, resolveCliArgsFromVSCodeExecutablePath, runTests } = require('@vscode/test-electron');

const inputs = {
  NOTEBOOK_VSCODE_EXT: process.env.NOTEBOOK_VSCODE_EXT
}

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '..');
    const extensionTestsPath = path.resolve(__dirname, './suite/index');
    const vscodeExecutablePath = await downloadAndUnzipVSCode();
    const [cliPath, ...args] = resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);

    cp.spawnSync(
      cliPath,
      [...args, '--install-extension', inputs.NOTEBOOK_VSCODE_EXT],
      { encoding: 'utf-8', stdio: 'inherit' }
    );

    await runTests({ vscodeExecutablePath, extensionDevelopmentPath, extensionTestsPath });
  } catch (err) {
    console.error('Failed to run tests:');
	console.log(err);
    process.exit(1);
  }
}

main();
