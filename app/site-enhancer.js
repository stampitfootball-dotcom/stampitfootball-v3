'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const SUPABASE_URL='https://eujaafpddvdtxqpeodsp.supabase.co';
const SUPABASE_KEY='sb_publishable_bYwRjZVA31vDpmcb2CdeTA_gWPZq92R';

const languages=[
  {code:'en',label:'English',flag:'🇬🇧',dir:'ltr'},
  {code:'ar',label:'العربية',flag:'🇸🇦',dir:'rtl'},
  {code:'tr',label:'Türkçe',flag:'🇹🇷',dir:'ltr'},
  {code:'it',label:'Italiano',flag:'🇮🇹',dir:'ltr'},
  {code:'es',label:'Español',flag:'🇪🇸',dir:'ltr'},
  {code:'hy',label:'Հայերեն',flag:'🇦🇲',dir:'ltr'}
];

const countryLabels={
  'England':'🇬🇧 England','Spain':'🇪🇸 Spain','Italy':'🇮🇹 Italy','Germany':'🇩🇪 Germany','France':'🇫🇷 France',
  'Netherlands':'🇳🇱 Netherlands','Portugal':'🇵🇹 Portugal','Saudi-Arabia':'🇸🇦 Saudi Arabia','Saudi Arabia':'🇸🇦 Saudi Arabia',
  'Turkey':'🇹🇷 Turkey','USA':'🇺🇸 USA','United States':'🇺🇸 USA','Belgium':'🇧🇪 Belgium','Scotland':'🏴 Scotland',
  'Greece':'🇬🇷 Greece','Brazil':'🇧🇷 Brazil','Argentina':'🇦🇷 Argentina','Mexico':'🇲🇽 Mexico','World':'🌐 UEFA / WORLD'
};
const countryOrder=['England','Spain','Italy','Germany','France','World','Netherlands','Portugal','Saudi-Arabia','Saudi Arabia','Turkey','USA','United States'];

function decorateFootballBrowsers(){
  document.querySelectorAll('.countryScroller').forEach(scroller=>{
    const buttons=[...scroller.querySelectorAll('button')];
    buttons.forEach(btn=>{
      if(!btn.dataset.countryRaw)btn.dataset.countryRaw=btn.textContent.trim();
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
    if(btn.textContent.trim()==='ALL WORLD')btn.textContent='ALL UEFA / WORLD';
  });
}

function readLanguage(){
  try{
    const saved=localStorage.getItem('stampit-language');
    if(languages.some(l=>l.code===saved))return saved;
  }catch{}
  const cookie=document.cookie.split('; ').find(x=>x.startsWith('googtrans='));
  const code=cookie?.split('/').pop();
  return languages.some(l=>l.code===code)?code:'en';
}

function applyDirection(code){
  const item=languages.find(l=>l.code===code)||languages[0];
  document.documentElement.lang=code;
  document.documentElement.dir=item.dir;
  document.body?.classList.toggle('rtlSite',item.dir==='rtl');
}

function setTranslateCookie(code){
  const hostname=window.location.hostname;
  if(code==='en'){
    document.cookie='googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    document.cookie=`googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${hostname.replace(/^www\./,'')}`;
    return;
  }
  const value=`/en/${code}`;
  document.cookie=`googtrans=${value};path=/;max-age=31536000;samesite=lax`;
  document.cookie=`googtrans=${value};path=/;domain=.${hostname.replace(/^www\./,'')};max-age=31536000;samesite=lax`;
}

function LanguageSelector({language,onChange}){
  return <div className="stampLanguagePicker" title="Website language">
    <span>🌐</span>
    <select value={language} onChange={e=>onChange(e.target.value)} aria-label="Website language">
      {languages.map(l=><option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
    </select>
  </div>;
}

export default function SiteEnhancer(){
  const[picks,setPicks]=useState([]),[loading,setLoading]=useState(true);
  const[language,setLanguage]=useState('en'),[headerTarget,setHeaderTarget]=useState(null);

  useEffect(()=>{
    decorateFootballBrowsers();
    let runs=0;
    const timer=setInterval(()=>{
      decorateFootballBrowsers();
      runs+=1;
      if(runs>=12)clearInterval(timer);
    },500);
    return()=>clearInterval(timer);
  },[]);

  useEffect(()=>{
    const current=readLanguage();
    setLanguage(current);
    applyDirection(current);
    setHeaderTarget(document.querySelector('.dashboardHeader'));

    window.googleTranslateElementInit=()=>{
      if(window.google?.translate?.TranslateElement){
        try{
          new window.google.translate.TranslateElement({
            pageLanguage:'en',
            includedLanguages:'ar,en,es,hy,it,tr',
            autoDisplay:false
          },'google_translate_element');
        }catch{}
      }
    };

    if(!document.getElementById('google-translate-script')){
      const script=document.createElement('script');
      script.id='google-translate-script';
      script.src='https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async=true;
      document.body.appendChild(script);
    }else if(window.google?.translate?.TranslateElement){
      window.googleTranslateElementInit?.();
    }
  },[]);

  const changeLanguage=code=>{
    setLanguage(code);
    applyDirection(code);
    try{localStorage.setItem('stampit-language',code)}catch{}
    setTranslateCookie(code);
    window.location.reload();
  };

  useEffect(()=>{
    let active=true;
    fetch(`${SUPABASE_URL}/rest/v1/free_picks?published=eq.true&select=*&order=kickoff_at.asc.nullslast,created_at.desc`,{
      headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`},cache:'no-store'
    }).then(r=>r.ok?r.json():[]).then(d=>{if(active)setPicks(Array.isArray(d)?d:[])}).catch(()=>{if(active)setPicks([])}).finally(()=>{if(active)setLoading(false)});
    return()=>{active=false};
  },[]);

  return <>
    <style>{`
      .stampLanguagePicker{position:absolute;right:116px;top:7px;z-index:80;display:flex;align-items:center;gap:5px;background:#071a17;border:1px solid #28534a;border-radius:7px;padding:3px 6px;color:#dce8e4;font-size:11px;box-shadow:0 4px 14px #0004}
      .stampLanguagePicker select{appearance:auto;background:transparent;border:0;outline:0;color:#e9f2ef;font-size:11px;font-weight:800;cursor:pointer;max-width:120px}
      .stampLanguagePicker option{background:#071a17;color:#fff}
      #google_translate_element,.goog-te-banner-frame,.goog-te-balloon-frame{display:none!important}
      body{top:0!important}
      html[dir="rtl"] .scoreTeam.home{justify-content:flex-start;text-align:left}
      html[dir="rtl"] .scoreTeam.away{justify-content:flex-end;text-align:right}
      html[dir="rtl"] .competitionSidebar{border-right:0;border-left:1px solid #19433c}
      @media(max-width:760px){.stampLanguagePicker{right:67px;top:12px;padding:2px 5px}.stampLanguagePicker select{max-width:94px;font-size:10px}.stampLanguagePicker>span{display:none}}
      @media(max-width:390px){.stampLanguagePicker{right:62px}.stampLanguagePicker select{max-width:80px}}
    `}</style>
    {headerTarget&&createPortal(<LanguageSelector language={language} onChange={changeLanguage}/>,headerTarget)}
    <div id="google_translate_element" aria-hidden="true"></div>
    <section id="free-picks-live" className="section picksEnhancer">
      <div className="sectionTitle"><div><span className="liveDot"></span> STAMP IT FREE PICKS</div><small>FREE FOR EVERYONE · UPDATED FROM OUR PICKS DESK</small></div>
      {loading?<div className="empty compact">Loading free picks…</div>:picks.length?<div className="pickGridEnhancer">{picks.map(p=><article className="pickCardEnhancer" key={p.id}><div className="pickTopEnhancer"><small>{p.league||'FOOTBALL'}</small><span className={`pickStatusEnhancer ${p.status||'pending'}`}>{(p.status||'pending').toUpperCase()}</span></div><h3>{p.home_team} <span>vs</span> {p.away_team}</h3>{p.kickoff_at&&<time>{new Date(p.kickoff_at).toLocaleString([],{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</time>}<div className="pickCallEnhancer"><small>{p.pick_type}</small><strong>{p.pick_value}</strong></div>{p.reasoning&&<p>{p.reasoning}</p>}</article>)}</div>:<div className="empty compact">No free picks have been published yet. Check back soon.</div>}
    </section>
  </>;
}
