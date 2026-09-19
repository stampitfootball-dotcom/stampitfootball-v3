'use client';
import { useEffect, useMemo, useState } from 'react';
import './football-hub.css';
import './score-hub-v2.css';

const liveStatuses=new Set(['1H','HT','2H','ET','BT','P','SUSP','INT','LIVE']);
const finishedStatuses=new Set(['FT','AET','PEN']);

// Featured competition order: top divisions first, then UEFA, then second tiers.
const topDivisionLeagueIds=[39,140,135,78,61,88,94,203];
const uefaLeagueIds=[2,3,848];
const secondTierLeagueIds=[40,141,136,79,62,89,95,204];
const featuredLeagueIds=[...topDivisionLeagueIds,...uefaLeagueIds,...secondTierLeagueIds];
const priorityLeagueIds=featuredLeagueIds;

const preferredCountries=['England','Spain','Italy','Germany','France','Netherlands','Portugal','Turkey','World','Saudi-Arabia','USA','Belgium','Scotland'];
const countryFlags={England:'🇬🇧',Spain:'🇪🇸',Italy:'🇮🇹',Germany:'🇩🇪',France:'🇫🇷',Netherlands:'🇳🇱',Portugal:'🇵🇹','Saudi-Arabia':'🇸🇦',Turkey:'🇹🇷',USA:'🇺🇸',Belgium:'🇧🇪',Scotland:'🏴',Greece:'🇬🇷',Brazil:'🇧🇷',Argentina:'🇦🇷',Mexico:'🇲🇽',World:'🌐'};

const priority=id=>{const i=priorityLeagueIds.indexOf(Number(id));return i<0?999:i};
const isFeaturedLeague=id=>featuredLeagueIds.includes(Number(id));
const sortMatches=list=>[...list].sort((a,b)=>priority(a.leagueId)-priority(b.leagueId)||new Date(a.utcDate||0)-new Date(b.utcDate||0)||String(a.competition||'').localeCompare(String(b.competition||'')));
const uniqueLeagues=list=>{const seen=new Set();return list.filter(l=>{const k=String(l.id);if(seen.has(k))return false;seen.add(k);return true})};
const countryLeagues=(all,country)=>uniqueLeagues(all.filter(l=>l.country===country)).sort((a,b)=>priority(a.id)-priority(b.id)||a.name.localeCompare(b.name));
const orderedCountries=all=>[...new Set(all.map(l=>l.country).filter(Boolean))].sort((a,b)=>{const ai=preferredCountries.indexOf(a),bi=preferredCountries.indexOf(b);if(ai>=0||bi>=0)return(ai<0?999:ai)-(bi<0?999:bi);return a.localeCompare(b)});
const filterMatches=(list,country,league)=>sortMatches(list.filter(m=>(!country||m.country===country)&&(league==='all'||!league||Number(m.leagueId)===Number(league))));
const countryLabel=c=>c==='World'?'UEFA / WORLD':c?.replace('Saudi-Arabia','Saudi Arabia');
const countryWithFlag=c=>`${countryFlags[c]||'⚽'} ${countryLabel(c)}`;

const socialLinks=[
  {name:'Instagram',href:'https://www.instagram.com/stampitfootball/',icon:'◎'},
  {name:'TikTok',href:'https://www.tiktok.com/@stamp.it.football',icon:'♪'},
  {name:'Facebook',href:'https://www.facebook.com/stampitfootball',icon:'f'},
  {name:'X',href:'https://x.com/stampitfootball',icon:'𝕏'}
];
function SocialLinks({footer=false}){return <div className={footer?'socialLinks footerSocialLinks':'socialLinks'}>{socialLinks.map(s=><a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name} title={s.name}><span>{s.icon}</span></a>)}</div>}
function articleTime(v){if(!v)return'NOW';try{return new Date(v).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}catch{return'NOW'}}
function kickoffTime(v){if(!v)return'—';try{return new Date(v).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}catch{return'—'}}
function liveMinute(m){
  if(m.status==='HT')return'HT';
  if(m.status==='BT')return'BREAK';
  if(m.status==='P')return'PENS';
  if(m.status==='SUSP')return'SUSP';
  if(m.status==='INT')return'INT';
  const min=m.minute??m.elapsed;
  if(min!==null&&min!==undefined){const extra=m.extra?`+${m.extra}`:'';return `${min}${extra}'`}
  return'LIVE';
}

function CompetitionSidebar({allLeagues,country,leagueId,onCountry,onLeague}){
  const countries=useMemo(()=>orderedCountries(allLeagues),[allLeagues]);
  const leagues=useMemo(()=>country?countryLeagues(allLeagues,country):[],[allLeagues,country]);
  return <aside className="competitionSidebar v2Sidebar">
    <div className="sidebarHeading"><span>COMPETITIONS</span><small>COUNTRIES & LEAGUES</small></div>
    <button className={`sideAll ${!country?'active':''}`} onClick={()=>onCountry('')}>🌍 All Competitions</button>
    <div className="countryList">{countries.map(c=><div className="countryGroup" key={c}>
      <button className={`countryButton ${country===c?'active':''}`} onClick={()=>onCountry(c)}><span>{countryWithFlag(c)}</span><b>{country===c?'−':'+'}</b></button>
      {country===c&&<div className="sideLeagues">
        <button className={leagueId==='all'?'active':''} onClick={()=>onLeague('all')}>All {countryLabel(c)}</button>
        {leagues.map(l=><button key={l.id} className={Number(leagueId)===Number(l.id)?'active':''} onClick={()=>onLeague(l.id)}>{l.logo&&<img src={l.logo} alt=""/>}<span>{l.name}</span></button>)}
      </div>}
    </div>)}</div>
  </aside>
}

function MatchCard({m,onOpen}){
  const live=liveStatuses.has(m.status),finished=finishedStatuses.has(m.status);
  const score=`${m.homeScore??'–'}  -  ${m.awayScore??'–'}`;
  const state=live?liveMinute(m):finished?'FT':kickoffTime(m.utcDate);
  return <button className={`scoreRow ${live?'isLive':''}`} onClick={()=>onOpen(m.id)}>
    <span className={`scoreTime ${live?'minuteOnly':''}`}><b className={live?'liveMinute':''}>{state}</b></span>
    <span className="scoreTeam home"><b>{m.home}</b>{m.homeLogo&&<img src={m.homeLogo} alt=""/>}</span>
    <strong>{score}</strong>
    <span className="scoreTeam away">{m.awayLogo&&<img src={m.awayLogo} alt=""/>}<b>{m.away}</b></span>
    <span className="favoriteStar">☆</span>
  </button>
}

function MatchGroups({matches,onOpen,emptyText,onTable}){
  if(!matches.length)return <div className="empty dashboardEmpty">{emptyText}</div>;
  const groups=[],map=new Map();
  matches.forEach(m=>{const key=`${m.leagueId||m.competition}-${m.country}`;if(!map.has(key)){const g={key,id:m.leagueId,name:m.competition||'Football',country:m.country||'International',logo:m.leagueLogo||m.flag,matches:[]};map.set(key,g);groups.push(g)}map.get(key).matches.push(m)});
  return <div className="leagueMatchGroups">{groups.map(g=><div className="leagueBlock" key={g.key}><div className="leagueBlockTitle"><span>{g.logo&&<img src={g.logo} alt=""/>}<span><small>{countryLabel(g.country)}</small><b>{g.name}</b></span></span>{g.id&&<button className="tableLink" onClick={()=>onTable?.(g.id)}>Table ›</button>}</div><div className="scoreRows">{g.matches.map(m=><MatchCard key={m.id} m={m} onOpen={onOpen}/>)}</div></div>)}</div>
}

function Standings({selected}){
  const[groups,setGroups]=useState([]),[loading,setLoading]=useState(false);
  useEffect(()=>{if(!selected?.id||!selected?.season){setGroups([]);return}setLoading(true);fetch(`/api/standings?league=${selected.id}&season=${selected.season}`,{cache:'no-store'}).then(r=>r.json()).then(d=>setGroups(d.groups||[])).catch(()=>setGroups([])).finally(()=>setLoading(false))},[selected?.id,selected?.season]);
  if(!selected?.id)return <div className="empty dashboardEmpty">Choose a competition from the left to view its table.</div>;
  return <div className="tableCard wideTable"><div className="tableTitle"><div>{selected.logo&&<img src={selected.logo} alt=""/>}<span><h3>{selected.name}</h3><small>{countryWithFlag(selected.country)} · {selected.season}</small></span></div><b>{loading?'UPDATING…':'LEAGUE TABLE'}</b></div>{loading?<div className="empty compact">Loading standings…</div>:groups.length?groups.map((g,gi)=><div key={gi} className="standGroup">{groups.length>1&&<h4>{g.name}</h4>}<div className="tableHead full"><span>POS</span><span>CLUB</span><span>PL</span><span>W</span><span>D</span><span>L</span><span>GD</span><span>PTS</span></div>{g.rows.map(r=><div className="tableRow full" key={r.teamId}><span>{r.rank}</span><span className="clubCell"><img src={r.logo}/><b>{r.team}</b></span><span>{r.played}</span><span>{r.win}</span><span>{r.draw}</span><span>{r.lose}</span><span>{r.goalsDiff>0?`+${r.goalsDiff}`:r.goalsDiff}</span><strong>{r.points}</strong></div>)}</div>):<div className="empty compact">Standings are not available for this competition right now.</div>}</div>
}

const SB_URL='https://eujaafpddvdtxqpeodsp.supabase.co';
const SB_KEY='sb_publishable_bYwRjZVA31vDpmcb2CdeTA_gWPZq92R';
async function sbAuth(path,body,token=''){
  const r=await fetch(SB_URL+'/auth/v1/'+path,{method:'POST',headers:{apikey:SB_KEY,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(d.msg||d.message||d.error_description||'Something went wrong');
  return d;
}
function AuthModal({close,reason='Join Stamp It Football',session,onSession}){
  const[mode,setMode]=useState(session?'account':'signin'),[email,setEmail]=useState(session?.user?.email||''),[password,setPassword]=useState(''),[name,setName]=useState(session?.user?.user_metadata?.display_name||''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
  const submit=async e=>{e.preventDefault();setBusy(true);setError('');setMessage('');try{
    if(mode==='reset'){await sbAuth('recover',{email,redirect_to:'https://stampitfootball.com'});setMessage('Password reset email sent. Check your inbox.');}
    else if(mode==='join'){const d=await sbAuth('signup',{email,password,data:{display_name:name}});if(d.access_token){const s={access_token:d.access_token,refresh_token:d.refresh_token,user:d.user};localStorage.setItem('stampit_session',JSON.stringify(s));onSession(s);close()}else setMessage('Account created. Check your email to confirm your account.');}
    else if(mode==='signin'){const d=await sbAuth('token?grant_type=password',{email,password});const s={access_token:d.access_token,refresh_token:d.refresh_token,user:d.user};localStorage.setItem('stampit_session',JSON.stringify(s));onSession(s);close();}
  }catch(x){setError(x.message)}finally{setBusy(false)}};
  const signOut=async()=>{try{await sbAuth('logout',{},session?.access_token)}catch{}localStorage.removeItem('stampit_session');onSession(null);close()};
  if(mode==='account')return <div className="modalBackdrop" onMouseDown={close}><div className="modal accountModal" onMouseDown={e=>e.stopPropagation()}><button className="x" onClick={close}>×</button><div className="eyebrow">STAMP IT FOOTBALL</div><h2>My Account</h2><div className="accountIdentity"><div className="accountAvatar">{(session?.user?.email||'S')[0].toUpperCase()}</div><div><b>{session?.user?.user_metadata?.display_name||'Member'}</b><span>{session?.user?.email}</span></div></div><p className="muted">Your Stamp It Football account is active. Favorite teams, competitions and member features can now be connected to this profile.</p><button className="primary wide" onClick={signOut}>SIGN OUT</button></div></div>;
  return <div className="modalBackdrop" onMouseDown={close}><div className="modal authRealModal" onMouseDown={e=>e.stopPropagation()}><button className="x" onClick={close}>×</button><div className="eyebrow">STAMP IT FOOTBALL</div><h2>{mode==='join'?'Create your free account':mode==='reset'?'Reset password':reason}</h2><p className="muted">{mode==='reset'?'Enter your email and we’ll send you a reset link.':'Browsing stays open. Your account unlocks member features, fantasy and future favorites.'}</p><form onSubmit={submit}>{mode==='join'?<input value={name} onChange={e=>setName(e.target.value)} placeholder="Display name" maxLength="40"/>:null}<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" required/>{mode!=='reset'?<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password (6+ characters)" minLength="6" required/>:null}{error?<div className="authError">{error}</div>:null}{message?<div className="authSuccess">{message}</div>:null}<button className="primary wide" disabled={busy}>{busy?'PLEASE WAIT…':mode==='signin'?'SIGN IN':mode==='join'?'JOIN FREE':'SEND RESET LINK'}</button></form>{mode==='signin'?<><button className="linkbtn" onClick={()=>setMode('reset')}>Forgot password?</button><button className="linkbtn" onClick={()=>setMode('join')}>New here? Join free</button></>:<button className="linkbtn" onClick={()=>setMode('signin')}>Back to sign in</button>}</div></div>
}

const statOrder=['Ball Possession','Total Shots','Shots on Goal','Shots off Goal','Blocked Shots','Corner Kicks','Fouls','Yellow Cards','Red Cards','Goalkeeper Saves','Total passes','Passes accurate'];
function MatchStats({data}){
  const teams=data.statistics||[];
  if(teams.length<1||!data.hasStatistics)return <section className="matchStatsPanel"><h3>MATCH STATS</h3><div className="statsUnavailable">Detailed statistics are not available from the data provider for this match yet.</div></section>;
  const home=teams.find(t=>Number(t.teamId)===Number(data.homeId))||teams[0];
  const away=teams.find(t=>Number(t.teamId)===Number(data.awayId))||teams[1]||{stats:[]};
  const get=(team,type)=>team?.stats?.find(s=>s.type===type)?.value;
  const rows=statOrder.map(type=>({type,home:get(home,type),away:get(away,type)})).filter(r=>r.home!==null&&r.home!==undefined||r.away!==null&&r.away!==undefined);
  if(!rows.length)return <section className="matchStatsPanel"><h3>MATCH STATS</h3><div className="statsUnavailable">Detailed statistics are not available from the data provider for this match yet.</div></section>;
  return <section className="matchStatsPanel"><h3>MATCH STATS</h3><div className="statsTeams"><span>{data.home}</span><span>{data.away}</span></div>{rows.map(r=><div className="statRow" key={r.type}><strong>{r.home??'—'}</strong><span>{r.type}</span><strong>{r.away??'—'}</strong></div>)}</section>;
}

function lineupRows(lineup){
  const grouped=new Map();
  (lineup?.startXI||[]).forEach((p,i)=>{
    const [r,c]=String(p.grid||'').split(':').map(Number);
    const row=Number.isFinite(r)&&r>0?r:(i===0?1:2+Math.floor((i-1)/4));
    const col=Number.isFinite(c)&&c>0?c:i+1;
    if(!grouped.has(row))grouped.set(row,[]);
    grouped.get(row).push({...p,_col:col});
  });
  return [...grouped.entries()].sort((a,b)=>a[0]-b[0]).map(([row,players])=>({row,players:players.sort((a,b)=>a._col-b._col)}));
}
function PlayerMarker({p}){return <div className="pitchPlayer"><span>{p.number??''}</span><b>{p.name||'Player'}</b></div>}
function LineupPitch({lineups}){
  if(!lineups?.length)return null;
  const home=lineups[0],away=lineups[1];
  const homeRows=lineupRows(home),awayRows=lineupRows(away).reverse();
  return <section className="lineups visualLineups"><h3>LINEUPS</h3><div className="lineupTeamHead"><div>{home?.logo&&<img src={home.logo} alt=""/>}<span><b>{home?.team}</b><small>{home?.formation||'Formation'}</small></span></div>{away&&<div><span><b>{away.team}</b><small>{away.formation||'Formation'}</small></span>{away.logo&&<img src={away.logo} alt=""/>}</div>}</div><div className="formationPitch"><div className="halfwayLine"></div><div className="centerCircle"></div><div className="pitchHalf homeHalf">{homeRows.map(r=><div className="formationRow" key={`h-${r.row}`}>{r.players.map(p=><PlayerMarker p={p} key={p.id||`${p.name}-${p._col}`}/>)}</div>)}</div>{away&&<div className="pitchHalf awayHalf">{awayRows.map(r=><div className="formationRow" key={`a-${r.row}`}>{r.players.map(p=><PlayerMarker p={p} key={p.id||`${p.name}-${p._col}`}/>)}</div>)}</div>}</div><div className="benchGrid">{lineups.map((l,i)=><div className="benchTeam" key={i}><h4>{l.team} · SUBSTITUTES</h4>{l.substitutes?.length?<div>{l.substitutes.map(p=><span key={p.id||p.name}><b>{p.number??''}</b>{p.name}</span>)}</div>:<small>Substitutes unavailable</small>}</div>)}</div></section>;
}

function MatchModal({id,close}){
  const[data,setData]=useState(null),[loading,setLoading]=useState(true);
  useEffect(()=>{let ok=true;setLoading(true);fetch(`/api/match?id=${id}`,{cache:'no-store'}).then(r=>r.json()).then(d=>{if(ok)setData(d.match||null)}).catch(()=>{if(ok)setData(null)}).finally(()=>{if(ok)setLoading(false)});return()=>{ok=false}},[id]);
  return <div className="modalBackdrop" onMouseDown={close}><div className="matchModal detailedMatchModal" onMouseDown={e=>e.stopPropagation()}><button className="x" onClick={close}>×</button>{loading?<div className="empty">Loading match details…</div>:!data?<div className="empty">Match details are temporarily unavailable.</div>:<><div className="matchHero"><small>{data.competition} · {data.round}</small><div className="detailTeams"><div><img src={data.homeLogo}/><b>{data.home}</b></div><strong>{data.homeScore??'–'} <span>–</span> {data.awayScore??'–'}</strong><div><img src={data.awayLogo}/><b>{data.away}</b></div></div><p>{liveStatuses.has(data.status)?liveMinute(data):data.statusLong}</p><div className="matchMeta"><span>🕒 {kickoffTime(data.utcDate)}</span>{data.venue&&<span>🏟 {data.venue}</span>}{data.referee&&<span>Ref: {data.referee}</span>}</div></div><MatchStats data={data}/>{data.events?.length>0&&<section className="lineups"><h3>MATCH TIMELINE</h3><div className="timeline">{data.events.map((e,i)=><div className="timelineRow" key={i}><span>{e.elapsed}'</span><i>{e.type==='Goal'?'⚽':e.type==='Card'?'🟨':'•'}</i><div><b>{e.player||e.team}</b><small>{e.detail}</small></div></div>)}</div></section>}{data.hasLineups&&<LineupPitch lineups={data.lineups}/>}</>}</div></div>
}

export default function Home(){
  const[liveMatches,setLiveMatches]=useState([]),[fixtures,setFixtures]=useState([]),[news,setNews]=useState([]),[auth,setAuth]=useState(false),[reason,setReason]=useState('Join Stamp It Football'),[session,setSession]=useState(null);
  const[scoresConfigured,setScoresConfigured]=useState(null),[liveLoading,setLiveLoading]=useState(true),[liveError,setLiveError]=useState(false),[newsConfigured,setNewsConfigured]=useState(false),[allLeagues,setAllLeagues]=useState([]),[selectedLeague,setSelectedLeague]=useState({id:39,name:'Premier League',country:'England',season:2026,logo:'https://media.api-sports.io/football/leagues/39.png'}),[matchId,setMatchId]=useState(null),[menuOpen,setMenuOpen]=useState(false);
  const[hubCountry,setHubCountry]=useState(''),[hubLeague,setHubLeague]=useState('all'),[hubView,setHubView]=useState('scores');
  const[liveExpanded,setLiveExpanded]=useState(false),[fixturesExpanded,setFixturesExpanded]=useState(false);
  const loadLive=async()=>{try{const r=await fetch('/api/live',{cache:'no-store'});if(!r.ok)throw new Error();const d=await r.json();setScoresConfigured(d.configured!==false);setLiveMatches(d.matches||[]);setLiveError(false)}catch{setLiveError(true)}finally{setLiveLoading(false)}};
  const loadFixtures=()=>fetch('/api/fixtures?days=2',{cache:'no-store'}).then(r=>r.json()).then(d=>{setScoresConfigured(d.configured!==false);setFixtures(d.matches||[])}).catch(()=>{});
  const loadNews=()=>fetch('/api/news',{cache:'no-store'}).then(r=>r.json()).then(d=>{setNewsConfigured(!!d.configured);setNews(d.articles||[])}).catch(()=>{});
  useEffect(()=>{try{const s=JSON.parse(localStorage.getItem('stampit_session')||'null');if(s?.access_token)setSession(s)}catch{}loadLive();loadFixtures();loadNews();fetch('/api/leagues').then(r=>r.json()).then(d=>{const ls=d.leagues||[];setAllLeagues(ls);const pl=ls.find(x=>Number(x.id)===39);if(pl)setSelectedLeague(pl)}).catch(()=>{});const a=setInterval(loadLive,20000),b=setInterval(loadFixtures,300000),c=setInterval(loadNews,60000);return()=>{clearInterval(a);clearInterval(b);clearInterval(c)}},[]);
  const gate=r=>{setReason(r);setAuth(true)};
  const upcoming=fixtures.filter(m=>!liveStatuses.has(m.status)&&!finishedStatuses.has(m.status));
  const recent=fixtures.filter(m=>finishedStatuses.has(m.status)).slice(-12).reverse();
  const shownLive=filterMatches(liveMatches,hubCountry,hubLeague);
  const shownUpcoming=filterMatches(upcoming,hubCountry,hubLeague);
  const shownRecent=filterMatches(recent,hubCountry,hubLeague);
  const featuredLive=hubCountry||hubLeague!=='all'?shownLive:shownLive.filter(m=>isFeaturedLeague(m.leagueId));
  const visibleFeaturedLive=liveExpanded?featuredLive:featuredLive.slice(0,24);
  const visibleAllLive=liveExpanded?shownLive:shownLive.slice(0,40);
  const visibleUpcoming=fixturesExpanded?shownUpcoming:shownUpcoming.slice(0,24);
  const pickLeague=id=>{setHubLeague(id);if(id!=='all'){const found=allLeagues.find(l=>Number(l.id)===Number(id));if(found)setSelectedLeague(found)}};
  const pickCountry=c=>{setHubCountry(c);setHubLeague('all');if(c){const first=countryLeagues(allLeagues,c)[0];if(first)setSelectedLeague(first)}};
  const showTable=id=>{const found=allLeagues.find(l=>Number(l.id)===Number(id));if(found){setHubCountry(found.country||'');setHubLeague(found.id);setSelectedLeague(found)}setHubView('tables');document.getElementById('football')?.scrollIntoView({behavior:'smooth'})};
  const navHub=view=>{setHubView(view);setMenuOpen(false);setTimeout(()=>document.getElementById('football')?.scrollIntoView({behavior:'smooth'}),0)};
  const activeTitle=hubCountry?(hubLeague==='all'?countryLabel(hubCountry):(allLeagues.find(l=>Number(l.id)===Number(hubLeague))?.name||countryLabel(hubCountry))):'All Competitions';

  return <main className="dashboardSite">
    <header className={`dashboardHeader compactHeader ${menuOpen?'menuOpen':''}`}>
      <a className="brand" href="#football" onClick={()=>setMenuOpen(false)}><img src="/assets/logo.jpeg"/><span><b>STAMP IT</b><small>FOOTBALL</small></span></a>
      <div className="headerSloganWrap"><div className="headerSlogan">IT’S FOOTBALL, <span>NOT SOCCER.</span></div><SocialLinks/></div>
      <nav><a href="#football" className={hubView==='scores'?'activeNav':''} onClick={e=>{e.preventDefault();navHub('scores')}}>Scores</a><a href="#football" className={hubView==='live'?'activeNav':''} onClick={e=>{e.preventDefault();navHub('live')}}>Live Now</a><a href="#football" className={hubView==='fixtures'?'activeNav':''} onClick={e=>{e.preventDefault();navHub('fixtures')}}>Fixtures</a><a href="#football" className={hubView==='tables'?'activeNav':''} onClick={e=>{e.preventDefault();navHub('tables')}}>Tables</a><a href="#news" onClick={()=>setMenuOpen(false)}>News</a><a href="#predictions" onClick={()=>setMenuOpen(false)}>Predictions</a><a href="#drafts" onClick={()=>setMenuOpen(false)}>Fantasy</a></nav>
      <div className="socialMini"><b>@stampitfootball</b></div>
      {session?<button className="loginButton" onClick={()=>gate('My Account')}>♙ Account</button>:<div className="authHeaderActions"><button className="loginButton" onClick={()=>gate('Welcome back')}>LOGIN</button><button className="joinButton" onClick={()=>gate('Create your free account')}>JOIN FREE</button></div>}
      <button className="menuToggle" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={()=>setMenuOpen(v=>!v)}><span></span><span></span><span></span></button>
    </header>

    <section id="football" className="footballDashboard v2FootballHub">
      <CompetitionSidebar allLeagues={allLeagues} country={hubCountry} leagueId={hubLeague} onCountry={pickCountry} onLeague={pickLeague}/>
      <div className="dashboardContent">
        <div className="hubTopbar">
          <div className="hubViewTabs"><button className={hubView==='scores'?'active':''} onClick={()=>setHubView('scores')}>Scores</button><button className={hubView==='live'?'active':''} onClick={()=>setHubView('live')}>Live Now</button><button className={hubView==='fixtures'?'active':''} onClick={()=>setHubView('fixtures')}>Fixtures</button><button className={hubView==='tables'?'active':''} onClick={()=>setHubView('tables')}>Table</button></div>
          <div className="siteAnnouncement" aria-label="Website announcement"><div className="announcementTrack"><span>🚀 STAMP IT FOOTBALL IS GROWING — MORE FEATURES ARE COMING SOON • PLEASE BEAR WITH US DURING THIS TESTING PERIOD • THE STAMP IT FOOTBALL APP IS COMING SOON 📱</span><span aria-hidden="true">🚀 STAMP IT FOOTBALL IS GROWING — MORE FEATURES ARE COMING SOON • PLEASE BEAR WITH US DURING THIS TESTING PERIOD • THE STAMP IT FOOTBALL APP IS COMING SOON 📱</span></div></div>
        </div>
        {hubView!=='tables'&&hubView!=='live'&&<div className="dateStrip compactDates"><button>‹</button><button className="active">Today</button><button>Tomorrow</button><button>{new Date(Date.now()+2*86400000).toLocaleDateString([],{weekday:'short',day:'numeric',month:'short'})}</button><button>{new Date(Date.now()+3*86400000).toLocaleDateString([],{weekday:'short',day:'numeric',month:'short'})}</button><button>›</button></div>}

        {hubView==='scores'&&<><div className="dashboardTitle"><div><h1>{hubCountry||hubLeague!=='all'?'Live Scores':'Featured Live Scores'}</h1><span className="liveNow"><i></i> Live ({featuredLive.length})</span></div></div>{liveLoading?<div className="empty dashboardEmpty">Checking live matches…</div>:liveError?<div className="empty dashboardEmpty">Live scores are temporarily unavailable. We’ll retry automatically.</div>:<><MatchGroups matches={visibleFeaturedLive} onOpen={setMatchId} onTable={showTable} emptyText={scoresConfigured?(shownLive.length?'No featured competitions are live right now. Tap Live Now to see every live match.':'No matches are live in this selection right now.'):'The football data connection is not configured.'}/>{featuredLive.length>24&&<button className="viewAllButton" onClick={()=>setLiveExpanded(v=>!v)}>{liveExpanded?'Show Less':'View More Featured Scores'} ›</button>}{!hubCountry&&hubLeague==='all'&&shownLive.length>featuredLive.length&&<button className="viewAllButton" onClick={()=>setHubView('live')}>Live Now · {shownLive.length} matches ›</button>}</>}</>}

        {hubView==='live'&&<><div className="dashboardTitle"><div><h1>Live Now</h1><span className="liveNow"><i></i> All Live ({shownLive.length})</span></div></div>{liveLoading?<div className="empty dashboardEmpty">Checking live matches…</div>:liveError?<div className="empty dashboardEmpty">Live scores are temporarily unavailable. We’ll retry automatically.</div>:<><MatchGroups matches={visibleAllLive} onOpen={setMatchId} onTable={showTable} emptyText={scoresConfigured?'No matches are live right now.':'The football data connection is not configured.'}/>{shownLive.length>40&&<button className="viewAllButton" onClick={()=>setLiveExpanded(v=>!v)}>{liveExpanded?'Show Less':'View All Live Matches'} ›</button>}</>}</>}

        {hubView==='fixtures'&&<><div className="dashboardTitle"><div><h1>Fixtures</h1><span className="hubSub">Upcoming matches · local time</span></div></div><MatchGroups matches={visibleUpcoming} onOpen={setMatchId} onTable={showTable} emptyText="No upcoming fixtures in this selection for the current two-day window."/>{(shownUpcoming.length>24||shownRecent.length>0)&&<button className="viewAllButton" onClick={()=>setFixturesExpanded(v=>!v)}>{fixturesExpanded?'Show Less':'View More Fixtures'} ›</button>}{fixturesExpanded&&shownRecent.length>0&&<><div className="subTitle">LATEST RESULTS</div><MatchGroups matches={shownRecent} onOpen={setMatchId} onTable={showTable} emptyText=""/></>}</>}

        {hubView==='tables'&&<><div className="dashboardTitle"><div><h1>League Table</h1><span className="hubSub">Choose any league from the left</span></div></div><Standings selected={selectedLeague}/></>}
      </div>
    </section>

    <section id="news" className="dashboardSection"><div className="sectionTitle"><div>Football News</div><small>{newsConfigured?'AUTO-REFRESHING':'STAMP IT BREAKING NEWS'}</small></div><div className="ticker"><span>BREAKING</span><b>BALLON D’OR 2026 — THE 30 NOMINEES ARE HERE</b></div><div className="newsGrid"><article className="news"><a href="/news/ballon-dor-2026" style={{display:'block',color:'inherit',textDecoration:'none'}}><img src="/api/ballondor-image?v=20260911-3" alt="Stamp It Football Ballon d'Or 2026 nominees graphic"/><small>STAMP IT FOOTBALL · BREAKING NEWS</small><h3>BALLON D’OR 2026: THE 30 NOMINEES ARE HERE</h3><p>Kylian Mbappé says he believes he can win this year’s Ballon d’Or. The winner will be revealed on October 26, 2026.</p><strong>READ FULL STORY →</strong></a></article>{news.slice(0,8).map((a,i)=><article className="news" key={i}>{a.image&&<img src={a.image} alt=""/>}<small>{a.source||'Football'} · {articleTime(a.publishedAt)}</small><h3>{a.title}</h3><p>{a.description}</p>{a.url&&<a href={a.url} target="_blank" rel="noreferrer">READ STORY →</a>}</article>)}</div></section>

    <section id="predictions" className="dashboardSection"><div className="sectionTitle"><div>Predictions</div><small>FREE + VIP</small></div><div className="split"><article className="panel"><div className="eyebrow">FREE FOR EVERYONE</div><h2>FREE PICKS</h2><p>Daily football predictions and match calls. No account required.</p><a className="primary inlineCta" href="/free-picks">VIEW FREE PICKS</a></article><article className="panel vip"><div className="eyebrow">MEMBERS ONLY</div><h2>VIP PREDICTIONS</h2><p>Premium picks and deeper analysis. Sign in and activate VIP access.</p><button className="primary" onClick={()=>gate('Sign in for VIP Predictions')}>UNLOCK VIP</button></article></div></section>

    <section id="drafts" className="dashboardSection"><div className="sectionTitle"><div>Fantasy & Prizes</div><small>FREE TO JOIN</small></div><div className="split"><article className="panel prize"><div className="eyebrow">FREE ACCOUNT REQUIRED</div><h2>WEEKLY DRAFT</h2><div className="prizeAmount">WEEKLY PRIZE</div><p>Make your picks. Earn points. Climb the leaderboard.</p><button className="primary" onClick={()=>gate('Join the Weekly Draft')}>JOIN WEEKLY DRAFT</button></article><article className="panel prize"><div className="eyebrow">FREE ACCOUNT REQUIRED</div><h2>MONTHLY DRAFT</h2><div className="prizeAmount">MONTHLY PRIZE</div><p>Compete across the month for a bigger prize and monthly bragging rights.</p><button className="primary" onClick={()=>gate('Join the Monthly Draft')}>JOIN MONTHLY DRAFT</button></article></div></section>

    <footer><b>STAMP IT FOOTBALL</b><span>IT’S FOOTBALL, NOT SOCCER.</span><SocialLinks footer/><span>@stampitfootball</span><span>Scores · News · Predictions · Fantasy</span></footer>
    {auth&&<AuthModal close={()=>setAuth(false)} reason={reason} session={session} onSession={setSession}/>} {matchId&&<MatchModal id={matchId} close={()=>setMatchId(null)}/>}</main>
}
