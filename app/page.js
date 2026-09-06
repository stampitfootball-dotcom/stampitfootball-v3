'use client';
import { useEffect, useState } from 'react';

const leagues = ['Premier League','Championship','La Liga','Serie A','Bundesliga','Ligue 1','Champions League'];
const tableDemo = [
  ['1','Connect live table API','—','—'],['2','Standings appear here','—','—'],['3','No fake table data','—','—']
];

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

function MatchCard({m}) { const live=['IN_PLAY','PAUSED','LIVE'].includes(m.status); return <article className={`match ${live?'isLive':''}`}>
  <div className="matchTop"><small>{m.competition || 'FOOTBALL'}</small>{live&&<span className="livePill">LIVE {m.minute?`${m.minute}'`:''}</span>}</div>
  <div className="teams"><b>{m.home}</b><strong>{m.homeScore ?? '–'}</strong><b>{m.away}</b><strong>{m.awayScore ?? '–'}</strong></div>
  <em>{live?'Live now':m.utcDate?new Date(m.utcDate).toLocaleString([], {weekday:'short',hour:'numeric',minute:'2-digit'}):m.status}</em>
</article> }

export default function Home(){
  const [matches,setMatches]=useState([]), [news,setNews]=useState([]), [auth,setAuth]=useState(false), [reason,setReason]=useState('Join Stamp It Football');
  const [scoresConfigured,setScoresConfigured]=useState(false), [newsConfigured,setNewsConfigured]=useState(false), [league,setLeague]=useState('Premier League');
  const loadScores=()=>fetch('/api/scores',{cache:'no-store'}).then(r=>r.json()).then(d=>{setScoresConfigured(!!d.configured);setMatches(d.matches||[])}).catch(()=>{});
  const loadNews=()=>fetch('/api/news',{cache:'no-store'}).then(r=>r.json()).then(d=>{setNewsConfigured(!!d.configured);setNews(d.articles||[])}).catch(()=>{});
  useEffect(()=>{loadScores();loadNews();const s=setInterval(loadScores,15000);const n=setInterval(loadNews,60000);return()=>{clearInterval(s);clearInterval(n)}},[]);
  const gate=(r)=>{setReason(r);setAuth(true)};
  const live=matches.filter(m=>['IN_PLAY','PAUSED','LIVE'].includes(m.status));
  const upcoming=matches.filter(m=>!['FINISHED','IN_PLAY','PAUSED','LIVE'].includes(m.status));

  return <main>
    <header><a className="brand" href="#top"><img src="/assets/logo.jpeg"/><span><b>STAMP IT</b><small>FOOTBALL</small></span></a>
      <nav><a href="#scores">Scores</a><a href="#fixtures">Fixtures</a><a href="#tables">Tables</a><a href="#news">News</a><a href="#predictions">Predictions</a><a href="#drafts">Win Prizes</a><a href="#merch">Merch</a></nav>
      <div className="auth"><button onClick={()=>gate('Welcome back')}>SIGN IN</button><button className="primary" onClick={()=>gate('Join Stamp It Football')}>JOIN FREE</button></div>
    </header>

    <section id="top" className="heroLaunch"><img className="heroLogo" src="/assets/logo.jpeg"/><div><div className="eyebrow">STAMP IT FOOTBALL</div><h1>IT’S FOOTBALL,<br/><span>NOT SOCCER.</span></h1><p>Live scores, fixtures, tables, breaking news, predictions and prize drafts — one football home.</p><div className="cta"><a className="primary" href="#scores">LIVE FOOTBALL</a><a className="secondary" href="#drafts">WIN PRIZES</a></div></div></section>

    <section id="scores" className="section"><div className="sectionTitle"><div><span className="liveDot"></span> LIVE SCORES</div><small>{scoresConfigured?'AUTO-REFRESHING':'CONNECT FOOTBALL API'}</small></div>
      {live.length?<div className="matchGrid">{live.slice(0,8).map(m=><MatchCard key={m.id} m={m}/>)}</div>:<div className="empty">{scoresConfigured?'No matches live right now. Upcoming fixtures are below.':'Live scores will appear here as soon as the football data key is connected.'}</div>}
    </section>

    <section id="fixtures" className="section"><div className="sectionTitle"><div>TODAY & UPCOMING FIXTURES</div><small>YOUR LOCAL KICKOFF TIME</small></div>
      {upcoming.length?<div className="matchGrid">{upcoming.slice(0,12).map(m=><MatchCard key={m.id} m={m}/>)}</div>:<div className="empty">Upcoming fixtures will populate from the live football feed.</div>}
    </section>

    <section id="tables" className="section"><div className="sectionTitle"><div>LEAGUE TABLES & STANDINGS</div><small>LIVE COMPETITION TABLES</small></div>
      <div className="leagueTabs">{leagues.map(x=><button className={league===x?'active':''} onClick={()=>setLeague(x)} key={x}>{x}</button>)}</div>
      <div className="tableCard"><h3>{league}</h3><div className="tableHead"><span>POS</span><span>CLUB</span><span>PL</span><span>PTS</span></div>{tableDemo.map(r=><div className="tableRow" key={r[0]}>{r.map((c,i)=><span key={i}>{c}</span>)}</div>)}<p className="tiny">This area is ready for the standings endpoint. It intentionally does not display invented league positions.</p></div>
    </section>

    <section id="news" className="section"><div className="sectionTitle"><div>FOOTBALL NOW — MINUTE BY MINUTE</div><small>{newsConfigured?'AUTO-REFRESHING NEWS':'CONNECT NEWS FEED'}</small></div>
      <div className="ticker"><span>BREAKING</span><b>{news[0]?.title || 'The latest football updates will run here automatically.'}</b></div>
      {news.length?<div className="newsGrid">{news.slice(0,9).map((a,i)=><article className="news" key={i}>{a.image&&<img src={a.image} alt=""/>}<small>{a.source} · {a.publishedAt?new Date(a.publishedAt).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}):'NOW'}</small><h3>{a.title}</h3><p>{a.description}</p>{a.url&&<a href={a.url} target="_blank" rel="noreferrer">READ STORY →</a>}</article>)}</div>:<div className="empty">Breaking news, transfers, injuries, lineups and major football developments will appear here when the news feed is connected.</div>}
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
    {auth&&<AuthModal close={()=>setAuth(false)} reason={reason}/>}</main>
}
