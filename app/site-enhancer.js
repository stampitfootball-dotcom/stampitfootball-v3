'use client';

import { useEffect, useState } from 'react';

const SUPABASE_URL = 'https://eujaafpddvdtxqpeodsp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_bYwRjZVA31vDpmcb2CdeTA_gWPZq92R';

export default function SiteEnhancer(){
  const [picks,setPicks]=useState([]);
  const [loading,setLoading]=useState(true);
  const [vip,setVip]=useState(false);

  useEffect(()=>{
    fetch(`${SUPABASE_URL}/rest/v1/free_picks?published=eq.true&select=*&order=kickoff_at.asc.nullslast,created_at.desc`,{
      headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`},cache:'no-store'
    }).then(r=>r.ok?r.json():[]).then(d=>setPicks(Array.isArray(d)?d:[])).finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    const section=document.getElementById('predictions');
    if(!section)return;
    const buttons=[...section.querySelectorAll('button')];
    const vipButton=buttons.find(b=>/VIP/i.test(b.textContent||''));
    if(!vipButton)return;
    const stop=e=>{e.preventDefault();e.stopImmediatePropagation();setVip(true)};
    vipButton.addEventListener('click',stop,true);
    return()=>vipButton.removeEventListener('click',stop,true);
  },[]);

  return <>
    <section id="free-picks-live" className="section picksEnhancer">
      <div className="sectionTitle"><div><span className="liveDot"></span> STAMP IT FREE PICKS</div><small>FREE FOR EVERYONE · UPDATED FROM OUR PICKS DESK</small></div>
      {loading?<div className="empty compact">Loading free picks…</div>:picks.length?<div className="pickGridEnhancer">{picks.map(p=><article className="pickCardEnhancer" key={p.id}>
        <div className="pickTopEnhancer"><small>{p.league||'FOOTBALL'}</small><span className={`pickStatusEnhancer ${p.status||'pending'}`}>{(p.status||'pending').toUpperCase()}</span></div>
        <h3>{p.home_team} <span>vs</span> {p.away_team}</h3>
        {p.kickoff_at&&<time>{new Date(p.kickoff_at).toLocaleString([], {weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</time>}
        <div className="pickCallEnhancer"><small>{p.pick_type}</small><strong>{p.pick_value}</strong></div>
        {p.reasoning&&<p>{p.reasoning}</p>}
      </article>)}</div>:<div className="empty compact">No free picks have been published yet. Check back soon.</div>}
    </section>
    {vip&&<div className="modalBackdrop" onMouseDown={()=>setVip(false)}><div className="modal vipSoonEnhancer" onMouseDown={e=>e.stopPropagation()}><button className="x" onClick={()=>setVip(false)}>×</button><div className="eyebrow">STAMP IT FOOTBALL</div><h2>VIP PICKS — COMING SOON</h2><p>Premium Stamp It Football predictions are on the way.</p><p className="muted">Follow @stampitfootball for launch updates.</p><button className="primary wide" onClick={()=>setVip(false)}>GOT IT</button></div></div>}
  </>;
}
