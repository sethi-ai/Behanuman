import sys
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).parent
mode=sys.argv[1]
files=sorted((root/mode).glob('*.webp'))
cols=4
thumb=(225,281) if mode=='facts' else (225,225)
for page in range(0,len(files),16):
    batch=files[page:page+16]
    sheet=Image.new('RGB',(cols*thumb[0],((len(batch)+cols-1)//cols)*(thumb[1]+24)),'#E3E3E1')
    draw=ImageDraw.Draw(sheet)
    for i,path in enumerate(batch):
        im=Image.open(path).convert('RGB')
        im.thumbnail(thumb)
        x,y=(i%cols)*thumb[0],(i//cols)*(thumb[1]+24)
        sheet.paste(im,(x,y))
        draw.text((x+5,y+thumb[1]+5),path.name,fill='#333333')
    dest=root/('review-'+mode.replace('/','-')+'-'+str(page//16+1)+'.jpg')
    sheet.save(dest,quality=92)
    print(dest)
