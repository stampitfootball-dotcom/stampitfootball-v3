'use client';

import { useEffect } from 'react';

export default function PredictionControls(){
  useEffect(()=>{
    let runs=0;
    const configure=()=>{
      const section=document.querySelector('#predictions');
      if(!section)return;
      const panels=section.querySelectorAll('article.panel');
      const free=panels[0];
      const vip=panels[1];

      if(free){
        const button=free.querySelector('button.primary');
        if(button&&!button.dataset.freePicksFixed){
          button.dataset.freePicksFixed='true';
          button.style.cursor='pointer';
          button.addEventListener('click',()=>{
            document.querySelector('#free-picks-live')?.scrollIntoView({behavior:'smooth',block:'start'});
          });
        }
      }

      if(vip){
        const eyebrow=vip.querySelector('.eyebrow');
        const paragraph=vip.querySelector('p');
        const button=vip.querySelector('button.primary');
        if(eyebrow)eyebrow.textContent='VIP PICKS';
        if(paragraph)paragraph.textContent='VIP predictions are coming soon. No sign-up or membership is required right now.';
        if(button){
          button.textContent='COMING SOON';
          button.disabled=true;
          button.style.cursor='default';
          button.style.opacity='.75';
          button.setAttribute('aria-disabled','true');
        }
      }
    };
    configure();
    const timer=setInterval(()=>{configure();runs+=1;if(runs>=20)clearInterval(timer)},500);
    return()=>clearInterval(timer);
  },[]);
  return null;
}
