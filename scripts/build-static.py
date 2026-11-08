"""Build only public app assets; no development or review files."""
from pathlib import Path
import shutil
root = Path(__file__).resolve().parents[1]
out = root / 'dist'
out.mkdir(exist_ok=True)
files = ['index.html', 'deck.css', 'old-school.css', 'old-school-art.png', 'main.js', 'transport.js', 'inspect.js', 'inspect.css', 'vendor/jsmediatags.min.js', 'vendor/jsmediatags-LICENSE.md']
files += ['audio/' + name + '.wav' for name in ['side-a', 'side-b', 'click', 'flip', 'rewind-trimmed']]
files += ['audio/CREDITS.md', 'LICENSE']
for name in files:
    target = out / name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(root / name, target)
print(f'Built {len(files)} files in {out}')
