import fs from 'node:fs/promises';
import React from 'react';
import {ImageResponse} from 'next/og.js';
const h=React.createElement;
const gada='data:image/png;base64,'+(await fs.readFile('public/images/ui/gada-brand.png')).toString('base64');

const image=async(tree,width,height)=>Buffer.from(await new ImageResponse(tree,{width,height}).arrayBuffer());
const ink='#292721',paper='#e3e3e1';
const card=h('div',{style:{display:'flex',width:'100%',height:'100%',background:paper,color:ink,fontFamily:'sans-serif',padding:'76px 88px',alignItems:'center',justifyContent:'space-between'}},
 h('div',{style:{display:'flex',flexDirection:'column',width:780}},
  h('div',{style:{fontSize:25,letterSpacing:'4px',color:'#6b665d',marginBottom:30}},'A LITTLE SPACE FOR DAILY DEVOTION'),
  h('div',{style:{fontSize:112,lineHeight:1}},'Be Hanuman'),
  h('div',{style:{fontSize:30,marginTop:28,color:'#5b5852'}},'Chant. Learn. Reflect.'),
  h('div',{style:{fontSize:23,marginTop:42,color:'#77716a'}},'behanuman.com')),
 h('div',{style:{display:'flex',alignItems:'center',justifyContent:'center',width:200,height:430}},h('img',{src:gada,width:147,height:350,style:{objectFit:'contain'}})));
await fs.writeFile('public/social-preview.png',await image(card,1200,630));
for(const size of [32,180,192,512]){
 const height=Math.round(size*.76),width=Math.round(height*125/300);
 const icon=h('div',{style:{display:'flex',width:'100%',height:'100%',alignItems:'center',justifyContent:'center',background:paper}},h('img',{src:gada,width,height}));
 const png=await image(icon,size,size);
 await fs.writeFile(`public/icon-${size}.png`,png);
 if(size===512)await fs.writeFile('public/share-gada.png',png);
 if(size===32){const ico=Buffer.alloc(22);ico.writeUInt16LE(1,2);ico.writeUInt16LE(1,4);ico[6]=32;ico[7]=32;ico.writeUInt16LE(1,10);ico.writeUInt16LE(32,12);ico.writeUInt32LE(png.length,14);ico.writeUInt32LE(22,18);await fs.writeFile('src/app/favicon.ico',Buffer.concat([ico,png]));}
}


