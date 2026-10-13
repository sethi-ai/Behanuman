import json, sys
from pathlib import Path
from PIL import Image, ImageOps
root = Path(__file__).parent
row = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
size = (1080,1350) if row['kind']=='story' else (600,600) if row['kind']=='shelf' else (900,900)
limit = 150000 if row['kind']=='story' else 90000
dest = root / row['dest']
dest.parent.mkdir(parents=True,exist_ok=True)
im = Image.open(row['source']).convert('RGB')
im = ImageOps.fit(im,size,method=Image.Resampling.LANCZOS)
for quality in range(92,19,-2):
    im.save(dest,'WEBP',quality=quality,method=6)
    if dest.stat().st_size<limit: break
assert dest.stat().st_size<limit
assert Image.open(dest).size==size
print(f'{row["dest"]}: {size[0]}x{size[1]}, {dest.stat().st_size} bytes')
