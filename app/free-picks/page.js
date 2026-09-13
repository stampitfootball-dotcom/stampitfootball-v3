'use client';
import {useEffect,useMemo,useState} from 'react';
import '../football-hub.css';

const SUPABASE_URL='https://eujaafpddvdtxqpeodsp.supabase.co';
const SUPABASE_KEY='sb_publishable_bYwRjZVA31vDpmcb2CdeTA_gWPZq92R';

const norm=s=>(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const pad=n=>String(n).padStart(2,'0');
const localYmd=value=>{const d=value instanceof Date?value:new Date(value);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const prettyDate=value=>new Date(`${value}T12:00:00`).toLocaleDateString([],{weekday:'long',month:'long',day:'numeric',year:'numeric'});
const shortDate=value=>new Date(`${value}T12:00:00`).toLocaleDateString([],{month:'short',day:'numeric'});
const finishedStatuses=new Set(['FT','AET','PEN']);

function findFixture(p,fixtures){
 if(p.fixture_id){const byId=fixtures.find(f=>String(f.id)===String(p.fixture_id));if(byId)return byId}
 const h=norm(p.home_team),a=norm(p.away_team);
 return fixtures.find(f=>norm(f.home)===h&&norm(f.away)===a)||null;
}

function evaluatePick(p,fixture){
 const stored=(p.status||'pending').toLowerCase();
 if(!fixture||!finishedStatuses.has(fixture.status)||fixture.homeScore==null||fixture.awayScore==null){
  return {status:stored,score:null,finished:false};
 }
 const home=Number(fixture.homeScore),away=Number(fixture.awayScore),total=home+away;
 const value=(p.pick_value||'').trim();
 const v=value.toLowerCase();
 let hit=null,push=false;
 const over=v.match(/over\s*(\d+(?:\.\d+)?)\s*(?:goals?)?/i);
 const under=v.match(/under\s*(\d+(?:\.\d+)?)\s*(?:goals?)?/i);
 if(over){const line=Number(over[1]);hit=total>line;push=Number.isInteger(line)&&total===line}
 else if(under){const line=Number(under[1]);hit=total<line;push=Number.isInteger(line)&&total===line}
 else if(v.includes('both teams to score')||v==='btts yes'||v==='btts - yes'||v==='btts'){hit=home>0&&away>0}
 else if(v==='btts no'||v.includes('both teams not to score')){hit=home===0||away===0}
 else if(v.includes(' or draw')){
  const team=value.split(/\s+or\s+draw/i)[0].trim();
  if(norm(team)===norm(p.home_team))hit=home>=away;
  else if(norm(team)===norm(p.away_team))hit=away>=home;
 } else if(v.includes('draw or ')){
  const team=value.split(/draw\s+or\s+/i)[1]?.trim();
  if(norm(team)===norm(p.home_team))hit=home>=away;
  else if(norm(team)===norm(p.away_team))hit=away>=home;
 } else if(v.includes(' to win')){
  const team=value.replace(/\s+to\s+win.*$/i,'').trim();
  if(norm(team)===norm(p.home_team))hit=home>away;
  else if(norm(team)===norm(p.away_team))hit=away>home;
 } else if(v==='home win'||v==='1'){hit=home>away}
 else if(v==='away win'||v==='2'){hit=away>home}
 else if(v==='draw'||v==='x'){hit=home===away}

 let status=stored;
 if(push)status='push';
 else if(hit===true)status='won';
 else if(hit===false)status='lost';
 return {status,score:`${home}–${away}`,finished:true};
}

export default function FreePicksPage(){
 const[picks,setPicks]=useState([]),[fixtures,setFixtures]=useState([]),[loading,setLoading]=useState(true),[fixturesLoading,setFixturesLoading]=useState(false),[selectedDate,setSelectedDate]=useState('');

 useEffect(()=>{let active=true;fetch(`${SUPABASE_URL}/rest/v1/free_picks?published=eq.true&select=*&order=kickoff_at.asc.nullslast,created_at.desc`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`},cache:'no-store'})
  .then(r=>r.ok?r.json():[]).then(data=>{if(!active)return;const list=Array.isArray(data)?data:[];setPicks(list);const dates=[...new Set(list.map(p=>p.kickoff_at?localYmd(p.kickoff_at):localYmd(p.created_at)).filter(Boolean))].sort();const today=localYmd(new Date());setSelectedDate(dates.includes(today)?today:(dates[dates.length-1]||today))}).catch(()=>{}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);

 useEffect(()=>{if(!selectedDate)return;let active=true;setFixturesLoading(true);fetch(`/api/fixtures?date=${selectedDate}&days=1`,{cache:'no-store'}).then(r=>r.ok?r.json():{matches:[]}).then(data=>{if(active)setFixtures(data.matches||[])}).catch(()=>{if(active)setFixtures([])}).finally(()=>{if(active)setFixturesLoading(false)});return()=>{active=false}},[selectedDate]);

 const availableDates=useMemo(()=>[...new Set(picks.map(p=>p.kickoff_at?localYmd(p.kickoff_at):localYmd(p.created_at)).filter(Boolean))].sort(),[picks]);
 const dayPicks=useMemo(()=>picks.filter(p=>(p.kickoff_at?localYmd(p.kickoff_at):localYmd(p.created_at))===selectedDate),[picks,selectedDate]);
 const enriched=useMemo(()=>dayPicks.map(p=>{const fixture=findFixture(p,fixtures);return {...p,fixture,result:evaluatePick(p,fixture)}}),[dayPicks,fixtures]);
 const groups=useMemo(()=>{const map=new Map();enriched.forEach(p=>{const k=p.league||'Football';if(!map.has(k))map.set(k,[]);map.get(k).push(p)});return [...map.entries()]},[enriched]);
 const record=useMemo(()=>{const won=enriched.filter(p=>p.result.status==='won').length,lost=enriched.filter(p=>p.result.status==='lost').length,push=enriched.filter(p=>['push','void'].includes(p.result.status)).length,pending=enriched.length-won-lost-push;const graded=won+lost;return {won,lost,push,pending,rate:graded?Math.round((won/graded)*100):null}},[enriched]);
 const currentIndex=availableDates.indexOf(selectedDate);
 const moveDate=dir=>{const next=availableDates[currentIndex+dir];if(next)setSelectedDate(next)};

 return <main className="freePicksPage">
  <header className="freePicksHeader"><a href="/" className="freePicksBrand"><img src="/assets/logo.jpeg" alt="Stamp It Football"/><span><b>STAMP IT</b><small>FOOTBALL</small></span></a><a href="/" className="backHome">← HOME</a></header>
  <section className="freePicksHero"><div className="eyebrow">STAMP IT FOOTBALL</div><h1>FREE PICKS</h1><p>Today’s picks and our complete results history.</p><div className="freeBadge">FREE PICKS · NO ACCOUNT REQUIRED</div></section>

  <section className="freeHistoryBar">
   <button onClick={()=>moveDate(-1)} disabled={currentIndex<=0} aria-label="Previous picks date">‹</button>
   <label><small>PICKS HISTORY</small><select value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}>{availableDates.map(d=><option value={d} key={d}>{prettyDate(d)}</option>)}</select></label>
   <button onClick={()=>moveDate(1)} disabled={currentIndex<0||currentIndex>=availableDates.length-1} aria-label="Next picks date">›</button>
  </section>

  {!!dayPicks.length&&<section className="recordStrip"><div><small>{shortDate(selectedDate)} RECORD</small><strong>{record.won} WINS · {record.lost} LOSSES{record.push?` · ${record.push} PUSH`:''}</strong></div><div className="recordRate"><b>{record.rate==null?'—':`${record.rate}%`}</b><span>HIT RATE</span></div>{record.pending>0&&<div className="pendingCount"><b>{record.pending}</b><span>PENDING</span></div>}</section>}

  <section className="freePicksContent">{loading?<div className="empty compact">Loading picks history…</div>:!dayPicks.length?<div className="empty compact">No free picks were published for this date.</div>:groups.map(([league,items])=><div className="freeLeague" key={league}><div className="freeLeagueTitle"><h2>{league}</h2><span>{items.length} PICKS</span></div><div className="freePickGrid">{items.map(p=>{const f=p.fixture,hl=f?.homeLogo||null,al=f?.awayLogo||null,s=p.result.status||'pending';return <article className={`freePickCard result-${s}`} key={p.id}><div className="freeKickoff">{p.kickoff_at?new Date(p.kickoff_at).toLocaleString([],{weekday:'short',hour:'numeric',minute:'2-digit'}):shortDate(selectedDate)}<span className={`pickStatusEnhancer ${s}`}>{s==='won'?'✓ WON':s==='lost'?'✕ LOST':s==='push'?'— PUSH':s==='void'?'— VOID':fixturesLoading?'CHECKING…':'PENDING'}</span></div><div className="freeTeams"><div>{hl?<img src={hl} alt=""/>:<span className="logoFallback">⚽</span>}<b>{p.home_team}</b></div><strong>{p.result.score||'VS'}</strong><div>{al?<img src={al} alt=""/>:<span className="logoFallback">⚽</span>}<b>{p.away_team}</b></div></div><div className="freeCall"><small>{p.pick_type}</small><strong>{p.pick_value}</strong></div>{p.result.finished&&<div className="finalScoreLabel">FINAL SCORE · {p.home_team} {p.result.score} {p.away_team}</div>}{p.reasoning&&<p>{p.reasoning}</p>}</article>})}</div></div>)}</section>
  <footer><b>STAMP IT FOOTBALL</b><span>IT’S FOOTBALL, NOT SOCCER.</span><span>@stampitfootball</span></footer>
  <style jsx global>{`
   .freePicksPage{min-height:100vh;background:#061512;color:#eef7f3}.freePicksHeader{height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 max(18px,calc((100vw - 1180px)/2));background:#071c18;border-bottom:1px solid #1c493f;position:sticky;top:0;z-index:20}.freePicksBrand{display:flex;align-items:center;gap:10px;color:white;text-decoration:none}.freePicksBrand img{width:48px;height:48px;border-radius:50%;object-fit:cover}.freePicksBrand span{display:flex;flex-direction:column;line-height:.95}.freePicksBrand b{font-size:18px}.freePicksBrand small{color:#36d3ba;font-weight:900;letter-spacing:2px}.backHome{color:#f7c84b;font-weight:900;text-decoration:none}.freePicksHero{text-align:center;padding:46px 18px 28px;background:radial-gradient(circle at 50% 0,#12493e 0,#071c18 55%,#061512 100%)}.freePicksHero h1{font-size:clamp(32px,6vw,62px);margin:7px 0;color:#fff}.freePicksHero p{color:#b8cec7;font-size:17px}.freeBadge{display:inline-block;margin-top:12px;padding:8px 13px;border:1px solid #347d6d;border-radius:999px;color:#55e5ca;font-weight:900;font-size:12px}.freeHistoryBar{max-width:760px;margin:22px auto 0;padding:0 18px;display:grid;grid-template-columns:46px 1fr 46px;gap:10px;align-items:stretch}.freeHistoryBar button{border:1px solid #28594f;background:#0a211d;color:#f7c84b;border-radius:12px;font-size:30px;font-weight:900;cursor:pointer}.freeHistoryBar button:disabled{opacity:.25;cursor:default}.freeHistoryBar label{display:flex;flex-direction:column;gap:5px;background:#0a211d;border:1px solid #28594f;border-radius:12px;padding:9px 13px}.freeHistoryBar label small{color:#65d8c1;font-size:10px;font-weight:900;letter-spacing:1.5px}.freeHistoryBar select{width:100%;background:transparent;color:#fff;border:0;outline:0;font-size:15px;font-weight:900}.freeHistoryBar option{background:#0a211d}.recordStrip{max-width:760px;margin:12px auto 0;padding:13px 18px;background:#0b2621;border:1px solid #28594f;border-radius:14px;display:flex;align-items:center;gap:22px}.recordStrip>div:first-child{flex:1;display:flex;flex-direction:column}.recordStrip small{color:#8eb0a8;font-weight:900}.recordStrip strong{font-size:15px;margin-top:2px}.recordRate,.pendingCount{display:flex;flex-direction:column;align-items:center;min-width:65px}.recordRate b{color:#55e5ca;font-size:21px}.pendingCount b{color:#f7c84b;font-size:21px}.recordRate span,.pendingCount span{font-size:9px;font-weight:900;color:#8eb0a8}.freePicksContent{max-width:1180px;margin:auto;padding:10px 18px 70px}.freeLeague{margin-top:30px}.freeLeagueTitle{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #245248;padding:0 2px 10px}.freeLeagueTitle h2{margin:0;font-size:22px}.freeLeagueTitle span{color:#f7c84b;font-size:11px;font-weight:900}.freePickGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:14px}.freePickCard{background:#0a211d;border:1px solid #1c493f;border-radius:14px;padding:16px;box-shadow:0 10px 28px #0003}.freePickCard.result-won{border-color:#228d70}.freePickCard.result-lost{border-color:#8c4040}.freeKickoff{display:flex;justify-content:space-between;gap:10px;color:#8eaaa2;font-size:11px;font-weight:900;text-transform:uppercase}.pickStatusEnhancer{white-space:nowrap}.pickStatusEnhancer.won{color:#5be2b8}.pickStatusEnhancer.lost{color:#ff7f7f}.pickStatusEnhancer.push,.pickStatusEnhancer.void{color:#c1c9c6}.pickStatusEnhancer.pending{color:#f7c84b}.freeTeams{display:grid;grid-template-columns:1fr 50px 1fr;align-items:center;gap:8px;margin:18px 0}.freeTeams>div{display:flex;align-items:center;gap:9px;min-width:0}.freeTeams>div:last-child{justify-content:flex-end;text-align:right}.freeTeams img,.logoFallback{width:34px;height:34px;object-fit:contain;flex:0 0 34px}.logoFallback{display:grid;place-items:center;font-size:23px}.freeTeams b{font-size:14px}.freeTeams>strong{text-align:center;color:#f0f5f3;font-size:15px}.freeCall{background:#061512;border-left:3px solid #f7c84b;border-radius:7px;padding:10px 12px;display:flex;flex-direction:column;gap:2px}.freeCall small{color:#8eaaa2;text-transform:uppercase;font-weight:900}.freeCall strong{color:#f7c84b;font-size:17px}.finalScoreLabel{margin-top:10px;color:#8eb0a8;font-size:10px;font-weight:900;text-transform:uppercase}.freePickCard p{color:#9eb6af;font-size:12px;line-height:1.45;margin:10px 2px 0}@media(max-width:700px){.freePickGrid{grid-template-columns:1fr}.freePicksHeader{height:62px}.freePicksBrand img{width:40px;height:40px}.freePicksHero{padding-top:34px}.freeTeams b{font-size:13px}.recordStrip{margin-left:18px;margin-right:18px;gap:12px}.recordStrip strong{font-size:12px}.recordRate,.pendingCount{min-width:52px}}
  `}</style>
 </main>
}
