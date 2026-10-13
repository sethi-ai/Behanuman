import json
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
root = Path(__file__).parent
rows = json.loads((root / 'generation-manifest.json').read_text())
for row in rows:
    story = row['id'].startswith('f')
    size = (1080,1350) if story else (900,900)
    limit = 150000 if story else 90000
    folder = root / ('facts' if story else 'ui')
    folder.mkdir(exist_ok=True)
    dest = folder / (row['name'] + '.webp')
    im = Image.open(row['source']).convert('RGB')
    im = ImageOps.fit(im, size, method=Image.Resampling.LANCZOS)
    for quality in range(92,39,-2):
        im.save(dest, 'WEBP', quality=quality, method=6)
        if dest.stat().st_size < limit:
            break
    assert dest.stat().st_size < limit
    assert Image.open(dest).size == size
    print(f'{dest.name}: {size}, {dest.stat().st_size} bytes, quality {quality}')
for story in (False, True):
    selected = [r for r in rows if r['id'].startswith('f') == story]
    thumb = (300,375) if story else (240,240)
    cols = 3 if story else 5
    sheet = Image.new('RGB',(cols*thumb[0], ((len(selected)+cols-1)//cols)*(thumb[1]+28)), '#E3E3E1')
    draw = ImageDraw.Draw(sheet)
    for i,row in enumerate(selected):
        folder = root / ('facts' if story else 'ui')
        im = Image.open(folder / (row['name']+'.webp'))
        im.thumbnail(thumb)
        x,y = (i%cols)*thumb[0], (i//cols)*(thumb[1]+28)
        sheet.paste(im,(x,y))
        draw.text((x+10,y+thumb[1]+6),row['id']+' '+row['name'],fill='#333333')
    sheet.save(root / ('story-style-check.jpg' if story else 'ui-style-check.jpg'), quality=93)
