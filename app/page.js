'use client';
import { useEffect, useMemo, useState } from 'react';
import './football-hub.css';

const liveStatuses=new Set(['1H','HT','2H','ET','BT','P','SUSP','INT','LIVE']);
const finishedStatuses=new Set(['FT','AET','PEN']);
const priorityLeagueIds=[39,140,135,78,61,88,40,136,2];
const quickLeagues=[['Premier League',39],['La Liga',140],['Serie A',135],['Bundesliga',78],['Ligue 1',61],['Eredivisie',88],['Championship',40],['Serie B',136],['Champions League',2]];
const preferredCountries=['England','Spain','Italy','Germany','France','Netherlands','Portugal','Saudi-Arabia','Turkey','USA','World'];
const countryFlags={England:'🏴',Spain:'🇪🇸',Italy:'🇮🇹',Germany:'🇩🇪',France:'🇫🇷',Netherlands:'🇳🇱',Portugal:'🇵🇹','Saudi-Arabia':'🇸🇦',Turkey:'🇹🇷',USA:'🇺🇸',Belgium:'🇧🇪',Scotland:'🏴',Greece:'🇬🇷',Brazil:'🇧🇷',Argentina:'🇦🇷',Mexico:'🇲🇽',World:'🌐'};

const priority=id=>{const i=priorityLeagueIds.indexOf(Number(id));return i<0?999:i};
const sortMatches=list=>[...list].sort((a,b)=>priority(a.leagueId)-priority(b.leagueId)||new Date(a.utcDate||0)-new Date(b.utcDate||0));
const uniqueLeagues=list=>{const seen=new Set();return list.filter(l=>{const k=String(l.id);if(seen.has(k))return false;seen.add(k);return true})};
const countryLeagues=(all,country)=>uniqueLeagues(all.filter(l=>l.country===country)).sort((a,b)=>priority(a.id)-priority(b.id)||a.name.localeCompare(b.name));
const orderedCountries=all=>[...new Set(all.map(l=>l.country).filter(Boolean))].sort((a,b)=>{const ai=preferredCountries.indexOf(a),bi=preferredCountries.indexOf(b);if(ai>=0||bi>=0)return(ai<0?999:ai)-(bi<0?999:bi);return a.localeCompare(b)});
const filterMatches=(list,country,league)=>sortMatches(list.filter(m=>(!country||m.country===country)&&(league==='all'||!league||Number(m.leagueId)===Number(league))));
const countryLabel=c=>c==='World'?'UEFA / WORLD':c?.replace('Saudi-Arabia','Saudi Arabia');
function articleTime(v){if(!v)return'NOW';try{return new Date(v).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}catch{return'NOW'}}

function CompetitionSidebar({allLeagues,country,setCountry,leagueId,setLeagueId}){
  const countries=useMemo(()=>orderedCountries(allLeagues),[allLeagues]);
  const leagues=useMemo(()=>country?countryLeagues(allLeagues,country):[],[allLeagues,country]);
  const chooseCountry=next=>{setCountry(next);setLeagueId('all')};
  return <aside className="competitionSidebar">
    <div className="sideTabs"><button className="active">Competitions</button><button>☆ Favourites</button></div>
    <button className={`sideAll ${!country?'active':''}`} onClick={()=>chooseCountry('')}>⚽ All Football</button>
    <div className="countryList">{countries.map(c=><div className="countryGroup" key={c}>
      <button className={`countryButton ${country===c?'active':''}`} onClick={()=>chooseCountry(c)}><span>{countryFlags[c]||'⚽'} {countryLabel(c)}</span><b>{country===c?'⌃':'⌄'}</b></button>
      {country===c&&<div className="sideLeagues"><button className={leagueId==='all'?'active':''} onClick={()=>setLeagueId('all')}>All {countryLabel(c)}</button>{leagues.map(l=><button key={l.id} className={Number(leagueId)===Number(l.id)?'active':''} onClick={()=>setLeagueId(l.id)}>{l.logo&&<img src={l.logo} alt=""/>}{l.name}</button>)}</div>}
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

function MatchGroups({matches,onOpen,emptyText}){
  if(!matches.length)return <div className="empty dashboardEmpty">{emptyText}</div>;
  const groups=[],map=new Map();
  matches.forEach(m=>{const key=`${m.leagueId||m.competition}-${m.country}`;if(!map.has(key)){const g={key,name:m.competition||'Football',country:m.country||'International',logo:m.leagueLogo||m.flag,matches:[]};map.set(key,g);groups.push(g)}map.get(key).matches.push(m)});
  return <div className="leagueMatchGroups">{groups.map(g=><div className="leagueBlock" key={g.key}><div className="leagueBlockTitle"><span>{g.logo&&<img src={g.logo} alt=""/>}<b>{g.name}</b></span><a href="#tables">See Table ›</a></div><div className="scoreRows">{g.matches.map(m=><MatchCard key={m.id} m={m} onOpen={onOpen}/>)}</div></div>)}</div>
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

function Standings({selected,allLeagues,setSelected}){
  const[groups,setGroups]=useState([]),[loading,setLoading]=useState(false),[query,setQuery]=useState('');
  useEffect(()=>{if(!selected?.id||!selected?.season)return;setLoading(true);fetch(`/api/standings?league=${selected.id}&season=${selected.season}`,{cache:'no-store'}).then(r=>r.json()).then(d=>setGroups(d.groups||[])).catch(()=>setGroups([])).finally(()=>setLoading(false))},[selected?.id,selected?.season]);
  const searchResults=query.trim().length>=2?allLeagues.filter(l=>`${l.name} ${l.country}`.toLowerCase().includes(query.toLowerCase())).slice(0,20):[];
  return <div className="standingsDashboard">
    <div className="leagueTabs">{quickLeagues.map(([name,id])=><button className={selected?.id===id?'active':''} onClick={()=>{const found=allLeagues.find(l=>Number(l.id)===Number(id));if(found)setSelected(found)}} key={id}>{name}</button>)}</div>
    <div className="leagueFinder"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search league or country…"/>{searchResults.length>0&&<div className="leagueResults">{searchResults.map(l=><button key={`${l.id}-${l.season}`} onClick={()=>{setSelected(l);setQuery('')}}><img src={l.logo||l.flag} alt=""/><span><b>{l.name}</b><small>{countryLabel(l.country)} · {l.season}</small></span></button>)}</div>}</div>
    <div className="tableCard wideTable"><div className="tableTitle"><div>{selected?.logo&&<img src={selected.logo} alt=""/>}<span><h3>{selected?.name||'League Table'}</h3><small>{countryLabel(selected?.country)} · {selected?.season}</small></span></div><b>{loading?'UPDATING…':'LIVE TABLE'}</b></div>{loading?<div className="empty compact">Loading standings…</div>:groups.length?groups.map((g,gi)=><div key={gi} className="standGroup">{groups.length>1&&<h4>{g.name}</h4>}<div className="tableHead full"><span>POS</span><span>CLUB</span><span>PL</span><span>W</span><span>D</span><span>L</span><span>GD</span><span>PTS</span></div>{g.rows.map(r=><div className="tableRow full" key={r.teamId}><span>{r.rank}</span><span className="clubCell"><img src={r.logo}/><b>{r.team}</b></span><span>{r.played}</span><span>{r.win}</span><span>{r.draw}</span><span>{r.lose}</span><span>{r.goalsDiff>0?`+${r.goalsDiff}`:r.goalsDiff}</span><strong>{r.points}</strong></div>)}</div>):<div className="empty compact">Standings are not available for this competition right now.</div>}</div>
  </div>
}

export default function Home(){
  const[liveMatches,setLiveMatches]=useState([]),[fixtures,setFixtures]=useState([]),[news,setNews]=useState([]),[auth,setAuth]=useState(false),[reason,setReason]=useState('Join Stamp It Football');
  const[scoresConfigured,setScoresConfigured]=useState(null),[liveLoading,setLiveLoading]=useState(true),[liveError,setLiveError]=useState(false),[newsConfigured,setNewsConfigured]=useState(false),[allLeagues,setAllLeagues]=useState([]),[selectedLeague,setSelectedLeague]=useState({id:39,name:'Premier League',country:'England',season:2026,logo:'https://media.api-sports.io/football/leagues/39.png'}),[matchId,setMatchId]=useState(null),[menuOpen,setMenuOpen]=useState(false);
  const[scoreCountry,setScoreCountry]=useState(''),[scoreLeague,setScoreLeague]=useState('all'),[fixtureCountry,setFixtureCountry]=useState(''),[fixtureLeague,setFixtureLeague]=useState('all');
  const[liveExpanded,setLiveExpanded]=useState(false),[fixturesExpanded,setFixturesExpanded]=useState(false);
  const loadLive=async()=>{try{const r=await fetch('/api/live',{cache:'no-store'});if(!r.ok)throw new Error();const d=await r.json();setScoresConfigured(d.configured!==false);setLiveMatches(d.matches||[]);setLiveError(false)}catch{setLiveError(true)}finally{setLiveLoading(false)}};
  const loadFixtures=()=>fetch('/api/fixtures?days=2',{cache:'no-store'}).then(r=>r.json()).then(d=>{setScoresConfigured(d.configured!==false);setFixtures(d.matches||[])}).catch(()=>{});
  const loadNews=()=>fetch('/api/news',{cache:'no-store'}).then(r=>r.json()).then(d=>{setNewsConfigured(!!d.configured);setNews(d.articles||[])}).catch(()=>{});
  useEffect(()=>{loadLive();loadFixtures();loadNews();fetch('/api/leagues').then(r=>r.json()).then(d=>{const ls=d.leagues||[];setAllLeagues(ls);const pl=ls.find(x=>x.id===39);if(pl)setSelectedLeague(pl)}).catch(()=>{});const a=setInterval(loadLive,20000),b=setInterval(loadFixtures,300000),c=setInterval(loadNews,60000);return()=>{clearInterval(a);clearInterval(b);clearInterval(c)}},[]);
  const gate=r=>{setReason(r);setAuth(true)};
  const upcoming=fixtures.filter(m=>!liveStatuses.has(m.status)&&!finishedStatuses.has(m.status));
  const recent=fixtures.filter(m=>finishedStatuses.has(m.status)).slice(-8).reverse();
  const shownLive=filterMatches(liveMatches,scoreCountry,scoreLeague),shownUpcoming=filterMatches(upcoming,fixtureCountry,fixtureLeague),shownRecent=filterMatches(recent,fixtureCountry,fixtureLeague);
  const visibleLive=liveExpanded?shownLive:shownLive.slice(0,24);
  const visibleUpcoming=fixturesExpanded?shownUpcoming:shownUpcoming.slice(0,18);

  return <main className="dashboardSite">
    <header className={`dashboardHeader ${menuOpen?'menuOpen':''}`}>
      <a className="brand" href="#scores" onClick={()=>setMenuOpen(false)}><img src="/assets/logo.jpeg"/><span><b>STAMP IT</b><small>FOOTBALL</small></span></a>
      <div className="headerSlogan">IT’S FOOTBALL, <span>NOT SOCCER.</span></div>
      <nav>{[['#scores','Live Scores'],['#fixtures','Fixtures'],['#tables','Tables'],['#news','News'],['#predictions','Predictions'],['#drafts','Fantasy']].map(([href,label])=><a key={href} href={href} onClick={()=>setMenuOpen(false)}>{label}</a>)}</nav>
      <div className="socialMini"><span>◎</span><span>♪</span><span>▶</span><span>f</span><b>@stampitfootball</b></div>
      <button className="loginButton" onClick={()=>gate('Welcome back')}>♙ Login</button>
      <button className="menuToggle" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={()=>setMenuOpen(v=>!v)}><span></span><span></span><span></span></button>
    </header>

    <section id="scores" className="footballDashboard">
      <CompetitionSidebar allLeagues={allLeagues} country={scoreCountry} setCountry={setScoreCountry} leagueId={scoreLeague} setLeagueId={setScoreLeague}/>
      <div className="dashboardContent">
        <div className="dateStrip"><button>▣</button><button className="active">Today</button><button>Tomorrow</button><button>{new Date(Date.now()+2*86400000).toLocaleDateString([],{weekday:'short',day:'numeric',month:'short'})}</button><button>{new Date(Date.now()+3*86400000).toLocaleDateString([],{weekday:'short',day:'numeric',month:'short'})}</button><button>▣</button></div>
        <div className="dashboardTitle"><div><h1>Live Scores</h1><span className="liveNow"><i></i> Live Now ({shownLive.length})</span></div><button>All Competitions⌄</button></div>
        {liveLoading?<div className="empty dashboardEmpty">Checking live matches…</div>:liveError?<div className="empty dashboardEmpty">Live scores are temporarily unavailable. We’ll retry automatically.</div>:<><MatchGroups matches={visibleLive} onOpen={setMatchId} emptyText={scoresConfigured?'No matches are live in this selection right now.':'The football data connection is not configured.'}/>{shownLive.length>24&&<button className="viewAllButton" onClick={()=>setLiveExpanded(v=>!v)}>{liveExpanded?'Show Less':'View All Live Scores'} ›</button>}</>}
      </div>
    </section>

    <section id="fixtures" className="dashboardSection"><div className="sectionTitle"><div>Fixtures</div><small>UPCOMING MATCHES · YOUR LOCAL TIME</small></div><div className="fixtureControls"><select value={fixtureCountry} onChange={e=>{setFixtureCountry(e.target.value);setFixtureLeague('all')}}><option value="">All countries</option>{orderedCountries(allLeagues).map(c=><option key={c} value={c}>{countryLabel(c)}</option>)}</select><select value={fixtureLeague} onChange={e=>setFixtureLeague(e.target.value)}><option value="all">All competitions</option>{fixtureCountry&&countryLeagues(allLeagues,fixtureCountry).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></div><MatchGroups matches={visibleUpcoming} onOpen={setMatchId} emptyText="No upcoming fixtures in this selection for the current two-day window."/>{(shownUpcoming.length>18||shownRecent.length>0)&&<button className="viewAllButton" onClick={()=>setFixturesExpanded(v=>!v)}>{fixturesExpanded?'Show Less Fixtures':'View More Fixtures'} ›</button>}{fixturesExpanded&&shownRecent.length>0&&<><div className="subTitle">LATEST RESULTS</div><MatchGroups matches={shownRecent} onOpen={setMatchId} emptyText=""/></>}</section>

    <section id="tables" className="dashboardSection"><div className="sectionTitle"><div>Tables</div><small>LEAGUE STANDINGS</small></div><Standings selected={selectedLeague} allLeagues={allLeagues} setSelected={setSelectedLeague}/></section>

    <section id="news" className="dashboardSection"><div className="sectionTitle"><div>Football News</div><small>{newsConfigured?'AUTO-REFRESHING':'STAMP IT BREAKING NEWS'}</small></div><div className="ticker"><span>BREAKING</span><b>BALLON D’OR 2026 — THE 30 NOMINEES ARE HERE</b></div><div className="newsGrid"><article className="news"><a href="/news/ballon-dor-2026" style={{display:'block',color:'inherit',textDecoration:'none'}}><img src="/api/ballondor-image?v=20260911-3" alt="Stamp It Football Ballon d'Or 2026 nominees graphic"/><small>STAMP IT FOOTBALL · BREAKING NEWS</small><h3>BALLON D’OR 2026: THE 30 NOMINEES ARE HERE</h3><p>Kylian Mbappé says he believes he can win this year’s Ballon d’Or. The winner will be revealed on October 26, 2026.</p><strong>READ FULL STORY →</strong></a></article>{news.slice(0,8).map((a,i)=><article className="news" key={i}>{a.image&&<img src={a.image} alt=""/>}<small>{a.source||'Football'} · {articleTime(a.publishedAt)}</small><h3>{a.title}</h3><p>{a.description}</p>{a.url&&<a href={a.url} target="_blank" rel="noreferrer">READ STORY →</a>}</article>)}</div></section>

    <section id="predictions" className="dashboardSection"><div className="sectionTitle"><div>Predictions</div><small>FREE + VIP</small></div><div className="split"><article className="panel"><div className="eyebrow">FREE FOR EVERYONE</div><h2>FREE PICKS</h2><p>Daily football predictions and match calls. No account required.</p><button className="primary">VIEW FREE PICKS</button></article><article className="panel vip"><div className="eyebrow">MEMBERS ONLY</div><h2>VIP PREDICTIONS</h2><p>Premium picks and deeper analysis. Sign in and activate VIP access.</p><button className="primary" onClick={()=>gate('Sign in for VIP Predictions')}>UNLOCK VIP</button></article></div></section>

    <section id="drafts" className="dashboardSection"><div className="sectionTitle"><div>Fantasy & Prizes</div><small>FREE TO JOIN</small></div><div className="split"><article className="panel prize"><div className="eyebrow">FREE ACCOUNT REQUIRED</div><h2>WEEKLY DRAFT</h2><div className="prizeAmount">WEEKLY PRIZE</div><p>Make your picks. Earn points. Climb the leaderboard.</p><button className="primary" onClick={()=>gate('Join the Weekly Draft')}>JOIN WEEKLY DRAFT</button></article><article className="panel prize"><div className="eyebrow">FREE ACCOUNT REQUIRED</div><h2>MONTHLY DRAFT</h2><div className="prizeAmount">MONTHLY PRIZE</div><p>Compete across the month for a bigger prize and monthly bragging rights.</p><button className="primary" onClick={()=>gate('Join the Monthly Draft')}>JOIN MONTHLY DRAFT</button></article></div></section>

    <footer><b>STAMP IT FOOTBALL</b><span>IT’S FOOTBALL, NOT SOCCER.</span><span>@stampitfootball</span><span>Scores · News · Predictions · Fantasy</span></footer>
    {auth&&<AuthModal close={()=>setAuth(false)} reason={reason}/>} {matchId&&<MatchModal id={matchId} close={()=>setMatchId(null)}/>}</main>
}