'use client';
import { useEffect, useMemo, useState } from 'react';
import './football-hub.css';
import './score-hub-v2.css';

const liveStatuses=new Set(['1H','HT','2H','ET','BT','P','SUSP','INT','LIVE']);
const finishedStatuses=new Set(['FT','AET','PEN']);
const priorityLeagueIds=[39,140,135,78,61,88,2,3,848,40,136,94,307,203,253,144,179];
const preferredCountries=['England','Spain','Italy','Germany','France','Netherlands','World','Portugal','Saudi-Arabia','Turkey','USA','Belgium','Scotland'];
const countryFlags={England:'🇬🇧',Spain:'🇪🇸',Italy:'🇮🇹',Germany:'🇩🇪',France:'🇫🇷',Netherlands:'🇳🇱',Portugal:'🇵🇹','Saudi-Arabia':'🇸🇦',Turkey:'🇹🇷',USA:'🇺🇸',Belgium:'🇧🇪',Scotland:'🏴',Greece:'🇬🇷',Brazil:'🇧🇷',Argentina:'🇦🇷',Mexico:'🇲🇽',World:'🌐'};

const priority=id=>{const i=priorityLeagueIds.indexOf(Number(id));return i<0?999:i};
const countryPriority=country=>{const i=preferredCountries.indexOf(country);return i<0?999:i};
const sortMatches=list=>[...list].sort((a,b)=>priority(a.leagueId)-priority(b.leagueId)||countryPriority(a.country)-countryPriority(b.country)||new Date(a.utcDate||0)-new Date(b.utcDate||0));
const uniqueLeagues=list=>{const seen=new Set();return list.filter(l=>{const k=String(l.id);if(seen.has(k))return false;seen.add(k);return true})};
const countryLeagues=(all,country)=>uniqueLeagues(all.filter(l=>l.country===country)).sort((a,b)=>priority(a.id)-priority(b.id)||a.name.localeCompare(b.name));
const orderedCountries=all=>[...new Set(all.map(l=>l.country).filter(Boolean))].sort((a,b)=>{const ai=preferredCountries.indexOf(a),bi=preferredCountries.indexOf(b);if(ai>=0||bi>=0)return(ai<0?999:ai)-(bi<0?999:bi);return a.localeCompare(b)});
const filterMatches=(list,country,league)=>sortMatches(list.filter(m=>(!country||m.country===country)&&(league==='all'||!league||Number(m.leagueId)===Number(league))));
const countryLabel=c=>c==='World'?'UEFA / WORLD':c?.replace('Saudi-Arabia','Saudi Arabia');
const countryWithFlag=c=>`${countryFlags[c]||'⚽'} ${countryLabel(c)}`;
function articleTime(v){if(!v)return'NOW';try{return new Date(v).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}catch{return'NOW'}}

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
  const time=live?(m.elapsed?`${m.elapsed}'`:'LIVE'):finished?'FT':m.utcDate?new Date(m.utcDate).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):m.statusLong||m.status;
  return <button className={`scoreRow ${live?'isLive':''}`} onClick={()=>onOpen(m.id)}>
    <span className="scoreTime">{time}</span>
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

function AuthModal({close,reason='Join Stamp It Football'}){
  const[mode,setMode]=useState('signin');
  return <div className="modalBackdrop" onMouseDown={close}><div className="modal" onMouseDown={e=>e.stopPropagation()}><button className="x" onClick={close}>×</button><div className="eyebrow">STAMP IT FOOTBALL</div><h2>{reason}</h2><p className="muted">Browsing is always open. An account is only required for prize drafts and VIP access.</p><form onSubmit={e=>e.preventDefault()}><input type="email" placeholder="Email" required/><input type="password" placeholder="Password" required/><button className="primary wide">{mode==='signin'?'SIGN IN':'JOIN FREE'}</button></form><button className="linkbtn" onClick={()=>setMode(mode==='signin'?'join':'signin')}>{mode==='signin'?'New here? Join free':'Already a member? Sign in'}</button></div></div>
}

function MatchModal({id,close}){
  const[data,setData]=useState(null),[loading,setLoading]=useState(true);
  useEffect(()=>{let ok=true;setLoading(true);fetch(`/api/match?id=${id}`,{cache:'no-store'}).then(r=>r.json()).then(d=>{if(ok)setData(d.match||null)}).catch(()=>{if(ok)setData(null)}).finally(()=>{if(ok)setLoading(false)});return()=>{ok=false}},[id]);
  return <div className="modalBackdrop" onMouseDown={close}><div className="matchModal" onMouseDown={e=>e.stopPropagation()}><button className="x" onClick={close}>×</button>{loading?<div className="empty">Loading match details…</div>:!data?<div className="empty">Match details are temporarily unavailable.</div>:<><div className="matchHero"><small>{data.competition} · {data.round}</small><div className="detailTeams"><div><img src={data.homeLogo}/><b>{data.home}</b></div><strong>{data.homeScore??'–'} <span>–</span> {data.awayScore??'–'}</strong><div><img src={data.awayLogo}/><b>{data.away}</b></div></div><p>{data.statusLong}</p></div>{data.events?.length>0&&<section className="lineups"><h3>MATCH TIMELINE</h3><div className="timeline">{data.events.map((e,i)=><div className="timelineRow" key={i}><span>{e.elapsed}'</span><i>{e.type==='Goal'?'⚽':e.type==='Card'?'🟨':'•'}</i><div><b>{e.player||e.team}</b><small>{e.detail}</small></div></div>)}</div></section>}</>}</div></div>
}

export default function Home(){
  const[liveMatches,setLiveMatches]=useState([]),[fixtures,setFixtures]=useState([]),[news,setNews]=useState([]),[auth,setAuth]=useState(false),[reason,setReason]=useState('Join Stamp It Football');
  const[scoresConfigured,setScoresConfigured]=useState(null),[liveLoading,setLiveLoading]=useState(true),[liveError,setLiveError]=useState(false),[newsConfigured,setNewsConfigured]=useState(false),[allLeagues,setAllLeagues]=useState([]),[selectedLeague,setSelectedLeague]=useState({id:39,name:'Premier League',country:'England',season:2026,logo:'https://media.api-sports.io/football/leagues/39.png'}),[matchId,setMatchId]=useState(null),[menuOpen,setMenuOpen]=useState(false);
  const[hubCountry,setHubCountry]=useState(''),[hubLeague,setHubLeague]=useState('all'),[hubView,setHubView]=useState('scores');
  const[liveExpanded,setLiveExpanded]=useState(false),[fixturesExpanded,setFixturesExpanded]=useState(false);
  const loadLive=async()=>{try{const r=await fetch('/api/live',{cache:'no-store'});if(!r.ok)throw new Error();const d=await r.json();setScoresConfigured(d.configured!==false);setLiveMatches(d.matches||[]);setLiveError(false)}catch{setLiveError(true)}finally{setLiveLoading(false)}};
  const loadFixtures=()=>fetch('/api/fixtures?days=2',{cache:'no-store'}).then(r=>r.json()).then(d=>{setScoresConfigured(d.configured!==false);setFixtures(d.matches||[])}).catch(()=>{});
  const loadNews=()=>fetch('/api/news',{cache:'no-store'}).then(r=>r.json()).then(d=>{setNewsConfigured(!!d.configured);setNews(d.articles||[])}).catch(()=>{});
  useEffect(()=>{loadLive();loadFixtures();loadNews();fetch('/api/leagues').then(r=>r.json()).then(d=>{const ls=d.leagues||[];setAllLeagues(ls);const pl=ls.find(x=>Number(x.id)===39);if(pl)setSelectedLeague(pl)}).catch(()=>{});const a=setInterval(loadLive,20000),b=setInterval(loadFixtures,300000),c=setInterval(loadNews,60000);return()=>{clearInterval(a);clearInterval(b);clearInterval(c)}},[]);
  const gate=r=>{setReason(r);setAuth(true)};
  const upcoming=fixtures.filter(m=>!liveStatuses.has(m.status)&&!finishedStatuses.has(m.status));
  const recent=fixtures.filter(m=>finishedStatuses.has(m.status)).slice(-12).reverse();
  const shownLive=filterMatches(liveMatches,hubCountry,hubLeague);
  const shownUpcoming=filterMatches(upcoming,hubCountry,hubLeague);
  const shownRecent=filterMatches(recent,hubCountry,hubLeague);
  const visibleLive=liveExpanded?shownLive:shownLive.slice(0,24);
  const visibleUpcoming=fixturesExpanded?shownUpcoming:shownUpcoming.slice(0,24);
  const pickLeague=id=>{setHubLeague(id);if(id!=='all'){const found=allLeagues.find(l=>Number(l.id)===Number(id));if(found)setSelectedLeague(found)}};
  const pickCountry=c=>{setHubCountry(c);setHubLeague('all');if(c){const first=countryLeagues(allLeagues,c)[0];if(first)setSelectedLeague(first)}};
  const showTable=id=>{const found=allLeagues.find(l=>Number(l.id)===Number(id));if(found){setHubCountry(found.country||'');setHubLeague(found.id);setSelectedLeague(found)}setHubView('tables');document.getElementById('football')?.scrollIntoView({behavior:'smooth'})};
  const navHub=view=>{setHubView(view);setMenuOpen(false);setTimeout(()=>document.getElementById('football')?.scrollIntoView({behavior:'smooth'}),0)};
  const activeTitle=hubCountry?(hubLeague==='all'?countryLabel(hubCountry):(allLeagues.find(l=>Number(l.id)===Number(hubLeague))?.name||countryLabel(hubCountry))):'All Competitions';

  return <main className="dashboardSite">
    <header className={`dashboardHeader compactHeader ${menuOpen?'menuOpen':''}`}>
      <a className="brand" href="#football" onClick={()=>setMenuOpen(false)}><img src="/assets/logo.jpeg"/><span><b>STAMP IT</b><small>FOOTBALL</small></span></a>
      <div className="headerSlogan">IT’S FOOTBALL, <span>NOT SOCCER.</span></div>
      <nav><a href="#football" className={hubView==='scores'?'activeNav':''} onClick={e=>{e.preventDefault();navHub('scores')}}>Live Scores</a><a href="#football" className={hubView==='fixtures'?'activeNav':''} onClick={e=>{e.preventDefault();navHub('fixtures')}}>Fixtures</a><a href="#football" className={hubView==='tables'?'activeNav':''} onClick={e=>{e.preventDefault();navHub('tables')}}>Tables</a><a href="#news" onClick={()=>setMenuOpen(false)}>News</a><a href="#predictions" onClick={()=>setMenuOpen(false)}>Predictions</a><a href="#drafts" onClick={()=>setMenuOpen(false)}>Fantasy</a></nav>
      <div className="socialMini"><b>@stampitfootball</b></div>
      <button className="loginButton" onClick={()=>gate('Welcome back')}>♙ Login</button>
      <button className="menuToggle" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={()=>setMenuOpen(v=>!v)}><span></span><span></span><span></span></button>
    </header>

    <section id="football" className="footballDashboard v2FootballHub">
      <CompetitionSidebar allLeagues={allLeagues} country={hubCountry} leagueId={hubLeague} onCountry={pickCountry} onLeague={pickLeague}/>
      <div className="dashboardContent">
        <div className="hubTopbar">
          <div className="hubViewTabs"><button className={hubView==='scores'?'active':''} onClick={()=>setHubView('scores')}>Scores</button><button className={hubView==='fixtures'?'active':''} onClick={()=>setHubView('fixtures')}>Fixtures</button><button className={hubView==='tables'?'active':''} onClick={()=>setHubView('tables')}>Table</button></div>
          <div className="selectedCompetition">{activeTitle}</div>
        </div>
        {hubView!=='tables'&&<div className="dateStrip compactDates"><button>‹</button><button className="active">Today</button><button>Tomorrow</button><button>{new Date(Date.now()+2*86400000).toLocaleDateString([],{weekday:'short',day:'numeric',month:'short'})}</button><button>{new Date(Date.now()+3*86400000).toLocaleDateString([],{weekday:'short',day:'numeric',month:'short'})}</button><button>›</button></div>}

        {hubView==='scores'&&<><div className="dashboardTitle"><div><h1>Live Scores</h1><span className="liveNow"><i></i> Live ({shownLive.length})</span></div></div>{liveLoading?<div className="empty dashboardEmpty">Checking live matches…</div>:liveError?<div className="empty dashboardEmpty">Live scores are temporarily unavailable. We’ll retry automatically.</div>:<><MatchGroups matches={visibleLive} onOpen={setMatchId} onTable={showTable} emptyText={scoresConfigured?'No matches are live in this selection right now.':'The football data connection is not configured.'}/>{shownLive.length>24&&<button className="viewAllButton" onClick={()=>setLiveExpanded(v=>!v)}>{liveExpanded?'Show Less':'View All Live Scores'} ›</button>}</>}</>}

        {hubView==='fixtures'&&<><div className="dashboardTitle"><div><h1>Fixtures</h1><span className="hubSub">Upcoming matches · local time</span></div></div><MatchGroups matches={visibleUpcoming} onOpen={setMatchId} onTable={showTable} emptyText="No upcoming fixtures in this selection for the current two-day window."/>{(shownUpcoming.length>24||shownRecent.length>0)&&<button className="viewAllButton" onClick={()=>setFixturesExpanded(v=>!v)}>{fixturesExpanded?'Show Less':'View More Fixtures'} ›</button>}{fixturesExpanded&&shownRecent.length>0&&<><div className="subTitle">LATEST RESULTS</div><MatchGroups matches={shownRecent} onOpen={setMatchId} onTable={showTable} emptyText=""/></>}</>}

        {hubView==='tables'&&<><div className="dashboardTitle"><div><h1>League Table</h1><span className="hubSub">Choose any league from the left</span></div></div><Standings selected={selectedLeague}/></>}
      </div>
    </section>

    <section id="news" className="dashboardSection"><div className="sectionTitle"><div>Football News</div><small>{newsConfigured?'AUTO-REFRESHING':'STAMP IT BREAKING NEWS'}</small></div><div className="ticker"><span>BREAKING</span><b>BALLON D’OR 2026 — THE 30 NOMINEES ARE HERE</b></div><div className="newsGrid"><article className="news"><a href="/news/ballon-dor-2026" style={{display:'block',color:'inherit',textDecoration:'none'}}><img src="/api/ballondor-image?v=20260911-3" alt="Stamp It Football Ballon d'Or 2026 nominees graphic"/><small>STAMP IT FOOTBALL · BREAKING NEWS</small><h3>BALLON D’OR 2026: THE 30 NOMINEES ARE HERE</h3><p>Kylian Mbappé says he believes he can win this year’s Ballon d’Or. The winner will be revealed on October 26, 2026.</p><strong>READ FULL STORY →</strong></a></article>{news.slice(0,8).map((a,i)=><article className="news" key={i}>{a.image&&<img src={a.image} alt=""/>}<small>{a.source||'Football'} · {articleTime(a.publishedAt)}</small><h3>{a.title}</h3><p>{a.description}</p>{a.url&&<a href={a.url} target="_blank" rel="noreferrer">READ STORY →</a>}</article>)}</div></section>

    <section id="predictions" className="dashboardSection"><div className="sectionTitle"><div>Predictions</div><small>FREE + VIP</small></div><div className="split"><article className="panel"><div className="eyebrow">FREE FOR EVERYONE</div><h2>FREE PICKS</h2><p>Daily football predictions and match calls. No account required.</p><a className="primary inlineCta" href="/free-picks">VIEW FREE PICKS</a></article><article className="panel vip"><div className="eyebrow">MEMBERS ONLY</div><h2>VIP PREDICTIONS</h2><p>Premium picks and deeper analysis. Sign in and activate VIP access.</p><button className="primary" onClick={()=>gate('Sign in for VIP Predictions')}>UNLOCK VIP</button></article></div></section>

    <section id="drafts" className="dashboardSection"><div className="sectionTitle"><div>Fantasy & Prizes</div><small>FREE TO JOIN</small></div><div className="split"><article className="panel prize"><div className="eyebrow">FREE ACCOUNT REQUIRED</div><h2>WEEKLY DRAFT</h2><div className="prizeAmount">WEEKLY PRIZE</div><p>Make your picks. Earn points. Climb the leaderboard.</p><button className="primary" onClick={()=>gate('Join the Weekly Draft')}>JOIN WEEKLY DRAFT</button></article><article className="panel prize"><div className="eyebrow">FREE ACCOUNT REQUIRED</div><h2>MONTHLY DRAFT</h2><div className="prizeAmount">MONTHLY PRIZE</div><p>Compete across the month for a bigger prize and monthly bragging rights.</p><button className="primary" onClick={()=>gate('Join the Monthly Draft')}>JOIN MONTHLY DRAFT</button></article></div></section>

    <footer><b>STAMP IT FOOTBALL</b><span>IT’S FOOTBALL, NOT SOCCER.</span><span>@stampitfootball</span><span>Scores · News · Predictions · Fantasy</span></footer>
    {auth&&<AuthModal close={()=>setAuth(false)} reason={reason}/>} {matchId&&<MatchModal id={matchId} close={()=>setMatchId(null)}/>}</main>
}
