export const metadata={title:"Ballon d'Or 2026 — Stamp It Football",description:"The 2026 Ballon d'Or nominees are here, with Kylian Mbappé among the contenders."};

export default function BallonDorArticle(){
  return <main style={{minHeight:'100vh',background:'#04100e',color:'#fff',fontFamily:'Arial,Helvetica,sans-serif'}}>
    <div style={{maxWidth:920,margin:'0 auto',padding:'22px 18px 80px'}}>
      <a href="/#news" style={{display:'inline-block',color:'#42d7d0',textDecoration:'none',fontWeight:800,marginBottom:20}}>← BACK TO NEWS</a>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}><img src="/assets/logo.jpeg" alt="Stamp It Football" style={{width:54,height:54,borderRadius:'50%',objectFit:'cover'}}/><div><b style={{fontSize:20}}>STAMP IT FOOTBALL</b><div style={{fontSize:13,letterSpacing:2,color:'#7cb9ad'}}>BREAKING NEWS</div></div></div>
      <h1 style={{fontSize:'clamp(36px,8vw,72px)',lineHeight:.98,margin:'0 0 14px',letterSpacing:-2}}>BALLON D’OR 2026:<br/>THE 30 NOMINEES ARE HERE</h1>
      <p style={{fontSize:17,color:'#a9bbb6',margin:'0 0 28px'}}>Published September 2026 · Stamp It Football</p>
      <img src="/api/ballondor-image?v=20260911-2" alt="Ballon d'Or 2026 Stamp It Football graphic" style={{display:'block',width:'100%',maxWidth:720,margin:'0 auto 30px',borderRadius:24,border:'1px solid #2d5a50',background:'#090b0a'}}/>
      <article style={{maxWidth:760,margin:'0 auto',fontSize:19,lineHeight:1.7,color:'#e5ecea'}}>
        <p>The 2026 Ballon d’Or race is officially underway after the 30-man men’s shortlist was announced on September 8.</p>
        <p>Kylian Mbappé is among the nominees and has made his ambition clear, saying he believes he can win the award this year. The Real Madrid forward is joined on the shortlist by many of world football’s biggest names.</p>
        <p>The winner is scheduled to be revealed on October 26, 2026 in London. Until then, the debate is open: who has done enough to take home football’s biggest individual prize?</p>
        <div style={{marginTop:34,padding:'22px 24px',border:'1px solid #2d5a50',borderRadius:18,background:'#081714'}}><b style={{display:'block',color:'#e7b94c',marginBottom:8}}>STAMP IT QUESTION</b><span>Who deserves the 2026 Ballon d’Or? Follow @stampitfootball and join the conversation.</span></div>
      </article>
    </div>
  </main>
}
