# *Notebook Runner* Action

This action runs and tests *interactive Notebooks* in [VS Code](https://code.visualstudio.com/).
When running *broken* Notebooks, that is, detecting cells that fail to run, it **comments on the pull request** with a link to the Notebooks output in the Actions summary. This way, any bugs/runtime errors can easily be detected and fixed.

## Requirements

This action requires a `image` which includes `xvfb`. See [example usage] for an image to use.

In addition, please install anything else that your notebook needs to run.

For example, in the case of CAP Notebooks which contains *Java* executable cells, `java` would need to be added:

```yaml
    - name: Checkout Java
      uses: actions/setup-java@v3
      with:
        distribution: zulu
        java-version: 18
```

## Inputs

| Name | Description | Required | Default |
| --- | --- | --- | ---- |
| `notebook-files` | Notebooks to be tested, separated by spaces | ✓ ||
| `notebook-file-ext` | Notebook file extension | | `.capnb` |
| `notebook-vscode-ext` | VS Code Notebook extension to install | | `SAPSE.vscode-cds` |
| `summary-on-success` | Add Notebook output for successful runs to Action summary | | `false` |
| `timeout` | Mocha timeout for VS Code tests | | `120000` |


## Example usage

Below is an example which uses the *CAP Notebook Runner* action is used once files are dumped into in the _./notebooks_ folder:

```yaml
container:
  # docker image containing xvfb
  image: sitespeedio/sitespeed.io

steps:
- name: Test CAP Notebooks
  uses: cap/notebook-tests@main
    with:
      notebook-files: "./notebooks/hello-world.capnb ./notebooks/jumpstart.capnb"
```
