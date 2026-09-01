$ErrorActionPreference = 'Stop'

$python = Get-Command python -ErrorAction SilentlyContinue
if ($python) {
    & $python.Source -m http.server 4173 --directory $PSScriptRoot
    exit $LASTEXITCODE
}

$pythonLauncher = Get-Command py -ErrorAction SilentlyContinue
if ($pythonLauncher) {
    & $pythonLauncher.Source -m http.server 4173 --directory $PSScriptRoot
    exit $LASTEXITCODE
}

throw '未找到 Python。也可以直接用浏览器打开 index.html。'
