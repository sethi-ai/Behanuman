"use client";
import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';

export default function SimpleMode(){
 const [host,setHost]=useState<HTMLElement|null>(null),[enabled,setEnabled]=useState(false);
 useEffect(()=>{
  const attach=()=>{
   let target=document.getElementById('simple-mode-settings');
   const settings=document.getElementById('settings');
   if(!target&&settings){target=document.createElement('div');target.id='simple-mode-settings';settings.appendChild(target);}
   setHost(target);
   const on=localStorage.getItem('bh_simple')==='1';
   setEnabled(on);document.documentElement.dataset.simple=String(on);
   if(on)window.dispatchEvent(new CustomEvent('bh:navigate',{detail:{tab:'chant'}}));
  };
  const frame=requestAnimationFrame(attach);window.addEventListener('bh:ready',attach);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('bh:ready',attach);};
 },[]);
 function toggle(){
  const on=!enabled;localStorage.setItem('bh_simple',on?'1':'0');
  document.documentElement.dataset.simple=String(on);setEnabled(on);
  window.dispatchEvent(new CustomEvent('bh:navigate',{detail:{tab:'chant'}}));
 }
 if(!host)return null;
 return <>{createPortal(<section className="simple-mode-panel"><h4>Simple mode</h4><p>Just Chant. Your Sankalp and saved progress stay safe.</p><button role="switch" aria-checked={enabled} onClick={toggle}>Simple mode: {enabled?'On':'Off'}</button><p>Use the Full mode button at the top right to bring back all options.</p></section>,host)}{enabled&&createPortal(<button className="simple-mode-exit" aria-label="Switch to full mode" onClick={toggle}><svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg><span>Full mode</span></button>,document.body)}</>;
}
