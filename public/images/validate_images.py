import json, shutil
from pathlib import Path
from PIL import Image
root=Path(__file__).parent
names=["home-sankalp","home-empty","home-complete","home-streak","chant-rest","learn-hub","learn-maxing","learn-audio","learn-stories","learn-sankalp","learn-mode","settings","x01-meditate","x02-namaste-stand","x03-playful-monkey","x04-gada","x05-flying","x06-ramnaam","x07-sleeping","x08-thinking","x09-celebrate","x10-offering"]
expected=[]
for i in range(1,109): expected.append((f'facts/f{i:03d}.webp',(1080,1350),150000))
for i in range(1,7): expected.append((f'facts/s{i}.webp',(600,600),90000))
for name in names:
    expected.append((f'ui/{name}.webp',(900,900),90000))
    src=root/f'ui/dark/{name}.webp'
    alias=root/f'ui/dark/{name}-dk.webp'
    shutil.copyfile(src,alias)
    expected.append((f'ui/dark/{name}.webp',(900,900),90000))
    expected.append((f'ui/dark/{name}-dk.webp',(900,900),90000))
results=[]
for relative,size,limit in expected:
    path=root/relative
    assert path.is_file(),f'Missing {relative}'
    with Image.open(path) as im:
        im.load()
        assert im.format=='WEBP',f'Wrong format {relative}'
        assert im.size==size,f'Wrong dimensions {relative}: {im.size}'
    count=path.stat().st_size
    assert count<limit,f'Too large {relative}: {count}'
    results.append({'file':relative,'width':size[0],'height':size[1],'bytes':count,'passed':True})
report={'status':'passed','stories':108,'shelf_covers':6,'light_ui':22,'dark_ui':22,'dark_filename_aliases':22,'unique_images':158,'webp_files':len(results),'total_bytes':sum(r['bytes'] for r in results),'files':results}
(root/'validation-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='files'}))
original=json.loads((root/'generation-manifest.json').read_text(encoding='utf-8'))
prompts={}
for row in original:
    dest=('facts/' if row['id'].startswith('f') else 'ui/')+row['name']+'.webp'
    prompts[dest]={'file':dest,'prompt':row['prompt'],'source':row['source']}
records=list((root/'generation-records').glob('*.json'))
records.sort(key=lambda p: (2 if p.stem.endswith('-final') else 1 if p.stem.endswith('-corrected') else 0,p.name))
for path in records:
    row=json.loads(path.read_text(encoding='utf-8'))
    prompts[row['dest']]={'file':row['dest'],'prompt':row['prompt'],'source':row['source']}
assert len(prompts)==158,len(prompts)
(root/'final-generation-manifest.json').write_text(json.dumps({'tool':'built-in image_gen','source_csv':'facts.csv','style_key':'alphaimgkey.md','images':list(prompts.values())},indent=2,ensure_ascii=False),encoding='utf-8')
