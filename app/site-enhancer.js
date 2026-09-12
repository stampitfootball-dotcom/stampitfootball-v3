'use client';

import { useEffect, useState } from 'react';

const SUPABASE_URL='https://eujaafpddvdtxqpeodsp.supabase.co';
const SUPABASE_KEY='sb_publishable_bYwRjZVA31vDpmcb2CdeTA_gWPZq92R';

const countryLabels={
  'England':'🇬🇧 England',
  'Spain':'🇪🇸 Spain',
  'Italy':'🇮🇹 Italy',
  'Germany':'🇩🇪 Germany',
  'France':'🇫🇷 France',
  'Netherlands':'🇳🇱 Netherlands',
  'Portugal':'🇵🇹 Portugal',
  'Saudi-Arabia':'🇸🇦 Saudi Arabia',
  'Saudi Arabia':'🇸🇦 Saudi Arabia',
  'Turkey':'🇹🇷 Turkey',
  'USA':'🇺🇸 USA',
  'United States':'🇺🇸 USA',
  'Belgium':'🇧🇪 Belgium',
  'Scotland':'🏴 Scotland',
  'Greece':'🇬🇷 Greece',
  'Brazil':'🇧🇷 Brazil',
  'Argentina':'🇦🇷 Argentina',
  'Mexico':'🇲🇽 Mexico',
  'World':'🌐 UEFA / WORLD'
};
const countryOrder=['England','Spain','Italy','Germany','France','World','Netherlands','Portugal','Saudi-Arabia','Saudi Arabia','Turkey','USA','United States'];

function decorateFootballBrowsers(){
  document.querySelectorAll('.countryScroller').forEach(scroller=>{
    const buttons=[...scroller.querySelectorAll('button')];
    buttons.forEach(btn=>{
      if(!btn.dataset.countryRaw) btn.dataset.countryRaw=btn.textContent.trim();
      const raw=btn.dataset.countryRaw;
      btn.textContent=countryLabels[raw]||raw;
    });
    buttons.sort((a,b)=>{
      const ar=a.dataset.countryRaw||'',br=b.dataset.countryRaw||'';
      const ai=countryOrder.indexOf(ar),bi=countryOrder.indexOf(br);
      if(ai>=0||bi>=0)return(ai<0?999:ai)-(bi<0?999:bi);
      return ar.localeCompare(br);
    }).forEach(btn=>scroller.appendChild(btn));
  });
  document.querySelectorAll('.leagueScroller button').forEach(btn=>{
    if(btn.dataset.navDecorated)return;
    const txt=btn.textContent.trim();
    if(txt==='ALL WORLD')btn.textContent='ALL UEFA / WORLD';
    btn.dataset.navDecorated='1';
  });
}

export default function SiteEnhancer(){
  const[picks,setPicks]=useState([]),[loading,setLoading]=useState(true);

  useEffect(()=>{
    decorateFootballBrowsers();
    const observer=new MutationObserver(()=>decorateFootballBrowsers());
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>observer.disconnect();
  },[]);

  useEffect(()=>{
    let active=true;
    fetch(`${SUPABASE_URL}/rest/v1/free_picks?published=eq.true&select=*&order=kickoff_at.asc.nullslast,created_at.desc`,{
      headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`},
      cache:'no-store'
    }).then(r=>r.ok?r.json():[]).then(d=>{if(active)setPicks(Array.isArray(d)?d:[])}).catch(()=>{if(active)setPicks([])}).finally(()=>{if(active)setLoading(false)});
    return()=>{active=false};
  },[]);

  return <section id="free-picks-live" className="section picksEnhancer">
    <div className="sectionTitle"><div><span className="liveDot"></span> STAMP IT FREE PICKS</div><small>FREE FOR EVERYONE · UPDATED FROM OUR PICKS DESK</small></div>
    {loading?<div className="empty compact">Loading free picks…</div>:picks.length?<div className="pickGridEnhancer">{picks.map(p=><article className="pickCardEnhancer" key={p.id}><div className="pickTopEnhancer"><small>{p.league||'FOOTBALL'}</small><span className={`pickStatusEnhancer ${p.status||'pending'}`}>{(p.status||'pending').toUpperCase()}</span></div><h3>{p.home_team} <span>vs</span> {p.away_team}</h3>{p.kickoff_at&&<time>{new Date(p.kickoff_at).toLocaleString([],{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</time>}<div className="pickCallEnhancer"><small>{p.pick_type}</small><strong>{p.pick_value}</strong></div>{p.reasoning&&<p>{p.reasoning}</p>}</article>)}</div>:<div className="empty compact">No free picks have been published yet. Check back soon.</div>}
  </section>;
}
