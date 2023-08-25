# *Notebook Runner* Action

This action runs and tests *interactive Notebooks* in [VS Code](https://code.visualstudio.com/).
When running *broken* Notebooks, that is, detecting cells that fail to run, it **comments on the pull request** with a link to the Notebooks output in the Actions summary. This way, any bugs/runtime errors can easily be detected and fixed.

## Requirements

This action requires a `image` which includes `xvfb`. See [example usage] for an image to use.
In addition, please install anything else that your notebook needs to run.


| Name | Description | Required | Default |
| --- | --- | --- | ---- |
| `notebook-files` | Notebooks to be tested, separated by spaces | ✓ ||
| `notebook-file-ext` | Notebook file extension | | `.capnb` |
| `notebook-vscode-ext` | VS Code Notebook extension to install | | `SAPSE.vscode-cds` |
| `summary-on-success` | Add Notebook output for successful runs to Action summary | | `false` |
| `timeout` | Mocha timeout for VS Code tests | | `120000` |


## Example usage

Below is an example which runs and tests 2 CAP Notebooks:

```yaml
test:  
  runs-on: ubuntu-latest
  steps:
  - name: Test CAP Notebooks
    uses: mnkiefer/notebook-tests@main
      with:
        notebook-files: "./test/helloWorld.capnb ./test/helloWorldWithError.capnb ./test/helloWorldWithError2.capnb"
```
