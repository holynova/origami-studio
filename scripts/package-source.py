"""Create a complete source archive without local hosting identity or Git state."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parents[1]
with ZipFile(root / 'dist/source.zip', 'w', ZIP_DEFLATED) as archive:
    for name in ['dist', 'scripts', 'docs', 'assets', 'README.md', 'LICENSE', 'package.json', 'package-lock.json', 'wrangler.jsonc', 'worker.js', '.gitignore']:
        item = root / name
        files = sorted(item.rglob('*')) if item.is_dir() else [item]
        for file in files:
            if file.is_file() and file.name != 'source.zip' and '__pycache__' not in file.parts:
                archive.write(file, file.relative_to(root))
print('Complete source packaged at dist/source.zip')
