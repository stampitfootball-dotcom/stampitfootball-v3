'use client';

import { useEffect, useState } from 'react';

const SUPABASE_URL='https://eujaafpddvdtxqpeodsp.supabase.co';
const SUPABASE_KEY='sb_publishable_bYwRjZVA31vDpmcb2CdeTA_gWPZq92R';

function useCollapsibleMatches(sectionId,limit,label){
  useEffect(()=>{
    const section=document.getElementById(sectionId);if(!section)return;
    let expanded=false,button=null,frame=null;
    const apply=()=>{
      frame=null;
      const groups=[...section.querySelectorAll(':scope > .leagueMatchGroups')];
      const primary=groups[0];if(!primary)return;
      const cards=[...primary.querySelectorAll('.match')];
      cards.forEach((card,i)=>{card.style.display=expanded||i<limit?'':'none'});
      [...primary.querySelectorAll('.leagueBlock')].forEach(block=>{
        const blockCards=[...block.querySelectorAll('.match')];
        block.style.display=blockCards.some(card=>card.style.display!=='none')?'':'none';
      });
      const extras=sectionId==='fixtures'?groups.slice(1):[];
      const sub=sectionId==='fixtures'?section.querySelector(':scope > .subTitle'):null;
      if(sub)sub.style.display=expanded?'':'none';
      extras.forEach(g=>{g.style.display=expanded?'':'none'});
      if(!button){
        button=document.createElement('button');button.type='button';button.className='primary';
        button.style.cssText='display:block;margin:22px auto 0;min-width:220px;';
        button.addEventListener('click',()=>{expanded=!expanded;apply()});
        primary.insertAdjacentElement('afterend',button);
      }
      const hidden=Math.max(0,cards.length-limit)+extras.reduce((n,g)=>n+g.querySelectorAll('.match').length,0);
      button.style.display=hidden>0?'block':'none';
      button.textContent=expanded?`SHOW LESS ${label}`:`SHOW MORE ${label}${hidden?` (${hidden})`:''}`;
    };
    const schedule=()=>{if(frame===null)frame=requestAnimationFrame(apply)};
    const observer=new MutationObserver(schedule);observer.observe(section,{childList:true,subtree:true});apply();
    return()=>{observer.disconnect();if(frame!==null)cancelAnimationFrame(frame);if(button)button.remove()};
  },[sectionId,limit,label]);
}

export default function SiteEnhancer(){
  const[picks,setPicks]=useState([]),[loading,setLoading]=useState(true),[soon,setSoon]=useState(null);

  useEffect(()=>{fetch(`${SUPABASE_URL}/rest/v1/free_picks?published=eq.true&select=*&order=kickoff_at.asc.nullslast,created_at.desc`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`},cache:'no-store'}).then(r=>r.ok?r.json():[]).then(d=>setPicks(Array.isArray(d)?d:[])).finally(()=>setLoading(false))},[]);

  useEffect(()=>{
    const listeners=[];const bind=(button,title,message)=>{if(!button)return;const stop=e=>{e.preventDefault();e.stopImmediatePropagation();setSoon({title,message})};button.addEventListener('click',stop,true);listeners.push([button,stop])};
    const predictions=document.getElementById('predictions');if(predictions){const buttons=[...predictions.querySelectorAll('button')];bind(buttons.find(b=>/VIP/i.test(b.textContent||'')),'VIP PICKS — COMING SOON','Premium Stamp It Football predictions are on the way.')}
    const header=document.querySelector('header');if(header){const buttons=[...header.querySelectorAll('button')];bind(buttons.find(b=>/SIGN IN/i.test(b.textContent||'')),'SIGN IN — COMING SOON','Member accounts are being finished now. You can still use live scores, fixtures, tables and free picks without an account.');bind(buttons.find(b=>/JOIN FREE/i.test(b.textContent||'')),'JOIN FREE — COMING SOON','Free member accounts are being finished now. The public football features are already available.')}
    const drafts=document.getElementById('drafts');if(drafts){[...drafts.querySelectorAll('button')].forEach(b=>bind(b,'PRIZE DRAFTS — COMING SOON','Weekly and monthly Stamp It Football prize drafts are coming soon. Follow @stampitfootball for launch updates.'))}
    return()=>listeners.forEach(([button,fn])=>button.removeEventListener('click',fn,true));
  },[]);

  useEffect(()=>{
    const news=document.getElementById('news');if(!news)return;
    const fix=()=>{
      const first=news.querySelector('.newsGrid .news');if(!first)return;
      const img=first.querySelector('img');if(img){img.src='/api/ballondor-image';img.alt="Ballon d'Or 2026 nominees";img.style.objectFit='cover';}
      let link=first.querySelector('a');
      if(link){link.href='/news/ballon-dor-2026';link.target='';link.rel='';}
      else{link=document.createElement('a');link.href='/news/ballon-dor-2026';link.style.cssText='display:block;color:inherit;text-decoration:none';while(first.firstChild)link.appendChild(first.firstChild);first.appendChild(link)}
      const action=link.querySelector('strong');if(action)action.textContent='READ FULL STORY →';
    };
    const observer=new MutationObserver(fix);observer.observe(news,{childList:true,subtree:true});fix();return()=>observer.disconnect();
  },[]);

  useCollapsibleMatches('scores',5,'LIVE SCORES');
  useCollapsibleMatches('fixtures',4,'FIXTURES');

  return <>
    <section id="free-picks-live" className="section picksEnhancer"><div className="sectionTitle"><div><span className="liveDot"></span> STAMP IT FREE PICKS</div><small>FREE FOR EVERYONE · UPDATED FROM OUR PICKS DESK</small></div>{loading?<div className="empty compact">Loading free picks…</div>:picks.length?<div className="pickGridEnhancer">{picks.map(p=><article className="pickCardEnhancer" key={p.id}><div className="pickTopEnhancer"><small>{p.league||'FOOTBALL'}</small><span className={`pickStatusEnhancer ${p.status||'pending'}`}>{(p.status||'pending').toUpperCase()}</span></div><h3>{p.home_team} <span>vs</span> {p.away_team}</h3>{p.kickoff_at&&<time>{new Date(p.kickoff_at).toLocaleString([],{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</time>}<div className="pickCallEnhancer"><small>{p.pick_type}</small><strong>{p.pick_value}</strong></div>{p.reasoning&&<p>{p.reasoning}</p>}</article>)}</div>:<div className="empty compact">No free picks have been published yet. Check back soon.</div>}</section>
    {soon&&<div className="modalBackdrop" onMouseDown={()=>setSoon(null)}><div className="modal vipSoonEnhancer" onMouseDown={e=>e.stopPropagation()}><button className="x" onClick={()=>setSoon(null)}>×</button><div className="eyebrow">STAMP IT FOOTBALL</div><h2>{soon.title}</h2><p>{soon.message}</p><p className="muted">Follow @stampitfootball for updates.</p><button className="primary wide" onClick={()=>setSoon(null)}>GOT IT</button></div></div>}
  </>;
}
