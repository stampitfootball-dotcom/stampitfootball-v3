'use client';
import { useEffect, useMemo, useState } from 'react';

const favoriteLeagues = [
  ['Premier League',39],['Championship',40],['La Liga',140],['Serie A',135],['Bundesliga',78],['Ligue 1',61],['Champions League',2]
];
const liveStatuses = new Set(['1H','HT','2H','ET','BT','P','SUSP','INT','LIVE']);
const finishedStatuses = new Set(['FT','AET','PEN']);

function AuthModal({close, reason='Join Stamp It Football'}) {
  const [mode,setMode]=useState('signin');
  return <div className="modalBackdrop" onMouseDown={close}><div className="modal" onMouseDown={e=>e.stopPropagation()}>
    <button className="x" onClick={close}>×</button><div className="eyebrow">STAMP IT FOOTBALL</div><h2>{reason}</h2>
    <p className="muted">Browsing is always open. An account is only required for prize drafts and VIP access.</p>
    <form onSubmit={e=>e.preventDefault()}><input type="email" placeholder="Email" required/><input type="password" placeholder="Password" required/><button className="primary wide">{mode==='signin'?'SIGN IN':'JOIN FREE'}</button></form>
    <button className="linkbtn" onClick={()=>setMode(mode==='signin'?'join':'signin')}>{mode==='signin'?'New here? Join free':'Already a member? Sign in'}</button>
    <p className="tiny">Launch UI only. Production authentication and secure database must be connected before accepting real accounts.</p>
  </div></div>
}

function eventIcon(e){
  const d=(e.detail||'').toLowerCase();
  if(e.type==='Goal') return '⚽';
  if(e.type==='Card' && d.includes('red')) return '🟥';
  if(e.type==='Card') return '🟨';
  if((e.type||'').toLowerCase().includes('subst')) return '↔';
  return '•';
}
function eventTime(e){ return `${e.elapsed ?? ''}${e.extra?`+${e.extra}`:''}'`; }

function LocalMinute({m, fetchedAt}){
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),15000);return()=>clearInterval(t)},[]);
  if(!liveStatuses.has(m.status)) return null;
  if(m.status==='HT') return <>HT</>;
  if(m.extra) return <>{m.minute}+{m.extra}'</>;
  let min=m.minute;
  if(typeof min==='number' && fetchedAt && ['1H','2H','ET'].includes(m.status)){
    min += Math.max(0,Math.floor((now-fetchedAt)/60000));
    if(m.status==='1H') min=Math.min(min,45);
    if(m.status==='2H') min=Math.min(min,90);
    if(m.status==='ET') min=Math.min(min,120);
  }
  return <>{min?`${min}'`:m.status}</>;
}

function MatchCard({m,onOpen,fetchedAt}) {
  const live=liveStatuses.has(m.status);
  const finished=finishedStatuses.has(m.status);
  const majorEvents=(m.events||[]).filter(e=>e.type==='Goal'||e.type==='Card').slice(-4);
  return <button className={`match ${live?'isLive':''}`} onClick={()=>onOpen(m.id)}>
    <div className="matchTop"><span className="competition"><img src={m.leagueLogo||m.flag||'/assets/logo.jpeg'} alt=""/><small>{m.competition || 'FOOTBALL'}</small></span>{live?<span className="livePill">LIVE <LocalMinute m={m} fetchedAt={fetchedAt}/></span>:<span className="statusPill">{finished?'FT':m.statusLong||m.status}</span>}</div>
    <div className="teams richTeams"><span><img src={m.homeLogo} alt=""/><b>{m.home}</b></span><strong>{m.homeScore ?? '–'}</strong><span><img src={m.awayLogo} alt=""/><b>{m.away}</b></span><strong>{m.awayScore ?? '–'}</strong></div>
    {majorEvents.length>0&&<div className="miniTimeline">{majorEvents.map((e,i)=><div key={i}><span>{eventIcon(e)} {eventTime(e)}</span><b>{e.player||e.team}</b>{e.assist&&<small>Assist: {e.assist}</small>}</div>)}</div>}
    <em>{live?'Live now · Tap for match timeline':m.utcDate?new Date(m.utcDate).toLocaleString([], {weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):m.statusLong}</em>
  </button>
}

function MatchModal({id,close}){
  const [data,setData]=useState(null),[loading,setLoading]=useState(true);
  useEffect(()=>{let ok=true;setLoading(true);fetch(`/api/match?id=${id}`,{cache:'no-store'}).then(r=>r.json()).then(d=>{if(ok)setData(d.match||null)}).finally(()=>{if(ok)setLoading(false)});return()=>{ok=false}},[id]);
  const stats=useMemo(()=>{
    if(!data?.statistics?.length) return [];
    const home=data.statistics.find(x=>x.team===data.home)?.stats||[];
    const away=data.statistics.find(x=>x.team===data.away)?.stats||[];
    const keys=['Ball Possession','Total Shots','Shots on Goal','Corner Kicks','Fouls','Yellow Cards','Red Cards','Offsides'];
    return keys.map(k=>({name:k,home:home.find(x=>x.type===k)?.value??'—',away:away.find(x=>x.type===k)?.value??'—'})).filter(x=>x.home!=='—'||x.away!=='—');
  },[data]);
  return <div className="modalBackdrop" onMouseDown={close}><div className="matchModal" onMouseDown={e=>e.stopPropagation()}><button className="x" onClick={close}>×</button>
    {loading?<div className="empty">Loading match details…</div>:!data?<div className="empty">Match details are temporarily unavailable.</div>:<>
      <div className="matchHero"><small>{data.competition} · {data.round}</small><div className="detailTeams"><div><img src={data.homeLogo}/><b>{data.home}</b></div><strong>{data.homeScore ?? '–'} <span>–</span> {data.awayScore ?? '–'}</strong><div><img src={data.awayLogo}/><b>{data.away}</b></div></div><p>{data.statusLong}{data.minute?` · ${data.minute}${data.extra?`+${data.extra}`:''}'`:''}</p></div>
      <div className="detailGrid"><section><h3>MATCH TIMELINE</h3>{data.events?.length?<div className="timeline">{data.events.map((e,i)=><div className="timelineRow" key={i}><span>{eventTime(e)}</span><i>{eventIcon(e)}</i><div><b>{e.player||e.team}</b><small>{e.detail}{e.assist?` · Assist: ${e.assist}`:''}</small></div></div>)}</div>:<div className="empty compact">No event timeline available yet.</div>}</section>
      <section><h3>MATCH STATS</h3>{stats.length?<div className="stats">{stats.map(s=><div key={s.name}><b>{String(s.home)}</b><span>{s.name}</span><b>{String(s.away)}</b></div>)}</div>:<div className="empty compact">Live statistics are not available for this match yet.</div>}</section></div>
      {data.lineups?.length>0&&<section className="lineups"><h3>LINEUPS</h3><div className="lineupGrid">{data.lineups.map((l,i)=><div key={i}><div className="lineupTeam"><img src={l.logo}/><b>{l.team}</b><span>{l.formation}</span></div>{l.startXI.map((p,j)=><p key={j}><span>{p.number??''}</span>{p.name}<small>{p.pos}</small></p>)}</div>)}</div></section>}
    </>}</div></div>
}

function Standings({selected,allLeagues,setSelected}){
  const [groups,setGroups]=useState([]),[loading,setLoading]=useState(false),[query,setQuery]=useState('');
  useEffect(()=>{if(!selected?.id||!selected?.season)return;setLoading(true);fetch(`/api/standings?league=${selected.id}&season=${selected.season}`,{cache:'no-store'}).then(r=>r.json()).then(d=>setGroups(d.groups||[])).catch(()=>setGroups([])).finally(()=>setLoading(false))},[selected?.id,selected?.season]);
  const searchResults=query.trim().length>=2?allLeagues.filter(l=>`${l.name} ${l.country}`.toLowerCase().includes(query.toLowerCase())).slice(0,20):[];
  const pickFavorite=id=>{const found=allLeagues.find(l=>l.id===id);if(found)setSelected(found)};
  return <>
    <div className="leagueTabs">{favoriteLeagues.map(([name,id])=><button className={selected?.id===id?'active':''} onClick={()=>pickFavorite(id)} key={id}>{name}</button>)}</div>
    <div className="leagueFinder"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search every league or country…"/>{searchResults.length>0&&<div className="leagueResults">{searchResults.map(l=><button key={`${l.id}-${l.season}`} onClick={()=>{setSelected(l);setQuery('')}}><img src={l.logo||l.flag} alt=""/><span><b>{l.name}</b><small>{l.country} · {l.season}</small></span></button>)}</div>}</div>
    <div className="tableCard wideTable"><div className="tableTitle"><div>{selected?.logo&&<img src={selected.logo} alt=""/>}<span><h3>{selected?.name||'League Table'}</h3><small>{selected?.country} · {selected?.season}</small></span></div><b>{loading?'UPDATING…':'LIVE TABLE'}</b></div>
      {loading?<div className="empty compact">Loading standings…</div>:groups.length?groups.map((g,gi)=><div key={gi} className="standGroup">{groups.length>1&&<h4>{g.name}</h4>}<div className="tableHead full"><span>POS</span><span>CLUB</span><span>PL</span><span>W</span><span>D</span><span>L</span><span>GD</span><span>PTS</span></div>{g.rows.map(r=><div className="tableRow full" key={r.teamId}><span>{r.rank}</span><span className="clubCell"><img src={r.logo}/><b>{r.team}</b>{r.description&&<small>{r.description}</small>}</span><span>{r.played}</span><span>{r.win}</span><span>{r.draw}</span><span>{r.lose}</span><span>{r.goalsDiff>0?`+${r.goalsDiff}`:r.goalsDiff}</span><strong>{r.points}</strong></div>)}</div>):<div className="empty compact">Standings are not available for this competition right now.</div>}
    </div>
  </>
}

export default function Home(){
  const [liveMatches,setLiveMatches]=useState([]),[fixtures,setFixtures]=useState([]),[news,setNews]=useState([]),[auth,setAuth]=useState(false),[reason,setReason]=useState('Join Stamp It Football');
  const [scoresConfigured,setScoresConfigured]=useState(false),[newsConfigured,setNewsConfigured]=useState(false),[liveFetchedAt,setLiveFetchedAt]=useState(null);
  const [allLeagues,setAllLeagues]=useState([]),[selectedLeague,setSelectedLeague]=useState({id:39,name:'Premier League',country:'England',season:2026,logo:'https://media.api-sports.io/football/leagues/39.png'}),[matchId,setMatchId]=useState(null);

  const loadLive=()=>fetch('/api/live',{cache:'no-store'}).then(r=>r.json()).then(d=>{setScoresConfigured(!!d.configured);setLiveMatches(d.matches||[]);setLiveFetchedAt(d.fetchedAt||Date.now())}).catch(()=>{});
  const loadFixtures=()=>fetch('/api/fixtures?days=2',{cache:'no-store'}).then(r=>r.json()).then(d=>{setScoresConfigured(!!d.configured);setFixtures(d.matches||[])}).catch(()=>{});
  const loadNews=()=>fetch('/api/news',{cache:'no-store'}).then(r=>r.json()).then(d=>{setNewsConfigured(!!d.configured);setNews(d.articles||[])}).catch(()=>{});
  useEffect(()=>{loadLive();loadFixtures();loadNews();fetch('/api/leagues').then(r=>r.json()).then(d=>{const ls=d.leagues||[];setAllLeagues(ls);const pl=ls.find(x=>x.id===39);if(pl)setSelectedLeague(pl)}).catch(()=>{});const liveTimer=setInterval(loadLive,20000);const fixtureTimer=setInterval(loadFixtures,300000);const newsTimer=setInterval(loadNews,60000);return()=>{clearInterval(liveTimer);clearInterval(fixtureTimer);clearInterval(newsTimer)}},[]);
  const gate=(r)=>{setReason(r);setAuth(true)};
  const upcoming=fixtures.filter(m=>!liveStatuses.has(m.status)&&!finishedStatuses.has(m.status));
  const recent=fixtures.filter(m=>finishedStatuses.has(m.status)).slice(-8).reverse();

  return <main>
    <header><a className="brand" href="#top"><img src="/assets/logo.jpeg"/><span><b>STAMP IT</b><small>FOOTBALL</small></span></a>
      <nav><a href="#scores">Scores</a><a href="#fixtures">Fixtures</a><a href="#tables">Tables</a><a href="#news">News</a><a href="#predictions">Predictions</a><a href="#drafts">Win Prizes</a><a href="#merch">Merch</a></nav>
      <div className="auth"><button onClick={()=>gate('Welcome back')}>SIGN IN</button><button className="primary" onClick={()=>gate('Join Stamp It Football')}>JOIN FREE</button></div>
    </header>

    <section id="top" className="heroLaunch"><img className="heroLogo" src="/assets/logo.jpeg"/><div><div className="eyebrow">STAMP IT FOOTBALL</div><h1>IT’S FOOTBALL,<br/><span>NOT SOCCER.</span></h1><p>Live scores, fixtures, tables, breaking news, predictions and prize drafts — one football home.</p><div className="cta"><a className="primary" href="#scores">LIVE FOOTBALL</a><a className="secondary" href="#drafts">WIN PRIZES</a></div></div></section>

    <section id="scores" className="section"><div className="sectionTitle"><div><span className="liveDot"></span> LIVE SCORES</div><small>{scoresConfigured?'API-FOOTBALL · AUTO-REFRESHING':'CONNECT FOOTBALL API'}</small></div>
      {liveMatches.length?<div className="matchGrid">{liveMatches.map(m=><MatchCard key={m.id} m={m} onOpen={setMatchId} fetchedAt={liveFetchedAt}/>)}</div>:<div className="empty">{scoresConfigured?'No matches are live right now. Upcoming fixtures are below.':'Live scores will appear here as soon as API-Football is connected.'}</div>}
    </section>

    <section id="fixtures" className="section"><div className="sectionTitle"><div>TODAY & UPCOMING FIXTURES</div><small>WORLDWIDE FOOTBALL · YOUR LOCAL TIME</small></div>
      {upcoming.length?<div className="matchGrid">{upcoming.slice(0,24).map(m=><MatchCard key={m.id} m={m} onOpen={setMatchId}/>)}</div>:<div className="empty">No upcoming fixtures in the current two-day window.</div>}
      {recent.length>0&&<><div className="subTitle">LATEST RESULTS</div><div className="matchGrid">{recent.map(m=><MatchCard key={m.id} m={m} onOpen={setMatchId}/>)}</div></>}
    </section>

    <section id="tables" className="section"><div className="sectionTitle"><div>LEAGUE TABLES & STANDINGS</div><small>SEARCH WORLDWIDE COMPETITIONS</small></div><Standings selected={selectedLeague} allLeagues={allLeagues} setSelected={setSelectedLeague}/></section>

    <section id="news" className="section"><div className="sectionTitle"><div>FOOTBALL NOW — MINUTE BY MINUTE</div><small>{newsConfigured?'AUTO-REFRESHING NEWS':'NEWS FEED NEXT'}</small></div>
      <div className="ticker"><span>BREAKING</span><b>{news[0]?.title || 'The live football data is connected. Breaking-news feed is our next integration.'}</b></div>
      {news.length?<div className="newsGrid">{news.slice(0,9).map((a,i)=><article className="news" key={i}>{a.image&&<img src={a.image} alt=""}/><small>{a.source} · {a.publishedAt?new Date(a.publishedAt).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}):'NOW'}</small><h3>{a.title}</h3><p>{a.description}</p>{a.url&&<a href={a.url} target="_blank" rel="noreferrer">READ STORY →</a>}</article>)}</div>:<div className="empty">Breaking news, transfers, injuries and major football developments will appear here after the news feed is connected.</div>}
    </section>

    <section id="predictions" className="section"><div className="sectionTitle"><div>PREDICTIONS</div><small>FREE + VIP</small></div><div className="split">
      <article className="panel"><div className="eyebrow">FREE FOR EVERYONE</div><h2>FREE PICKS</h2><p>Daily football predictions and match calls. No account required.</p><button className="primary">VIEW FREE PICKS</button></article>
      <article className="panel vip"><div className="eyebrow">MEMBERS ONLY</div><h2>VIP PREDICTIONS</h2><p>Premium picks and deeper analysis. Sign in and activate VIP access.</p><button className="primary" onClick={()=>gate('Sign in for VIP Predictions')}>UNLOCK VIP</button></article>
    </div></section>

    <section id="drafts" className="section"><div className="sectionTitle"><div>WIN PRIZES</div><small>PROVE YOUR FOOTBALL KNOWLEDGE</small></div><div className="split">
      <article className="panel prize"><div className="eyebrow">FREE ACCOUNT REQUIRED</div><h2>WEEKLY DRAFT</h2><div className="prizeAmount">WEEKLY PRIZE</div><p>Make your picks. Earn points. Climb the leaderboard. New competition every week.</p><div className="miniLinks"><span>Rules</span><span>Leaderboard</span><span>Previous Winners</span><span>Prize Info</span></div><button className="primary" onClick={()=>gate('Join the Weekly Draft')}>JOIN WEEKLY DRAFT</button></article>
      <article className="panel prize"><div className="eyebrow">FREE ACCOUNT REQUIRED</div><h2>MONTHLY DRAFT</h2><div className="prizeAmount">MONTHLY PRIZE</div><p>Compete across the month for a bigger prize and monthly bragging rights.</p><div className="miniLinks"><span>Rules</span><span>Leaderboard</span><span>Previous Winners</span><span>Prize Info</span></div><button className="primary" onClick={()=>gate('Join the Monthly Draft')}>JOIN MONTHLY DRAFT</button></article>
    </div><p className="legalNote">Prize eligibility, official rules, entry deadlines and claim terms will be published before each competition opens.</p></section>

    <section id="merch" className="section merch"><div><div className="eyebrow">STAMP IT FOOTBALL</div><h2>MERCH</h2><p>Official Stamp It Football gear is coming soon.</p></div><button className="secondary">COMING SOON</button></section>
    <footer><b>STAMP IT FOOTBALL</b><span>IT’S FOOTBALL, NOT SOCCER.</span><span>@stampitfootball</span><span>Scores · News · Predictions · Prize Drafts</span></footer>
    {auth&&<AuthModal close={()=>setAuth(false)} reason={reason}/>} {matchId&&<MatchModal id={matchId} close={()=>setMatchId(null)}/>}</main>
}
