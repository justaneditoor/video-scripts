function parseScript(txt){
  const out=[];let br=false;
  txt.replace(/\r/g,"").split("\n").forEach(raw=>{
    const l=raw.trim(); if(!l){br=true;return}
    const b=l.length>2&&l.startsWith("*")&&l.endsWith("*");
    out.push({t:b?l.slice(1,-1).trim():l.replace(/\*/g,""),b,br:br&&out.length>0});br=false;
  });return out;
}
function findPauses(x,sr,D){
  const hop=Math.max(1,Math.round(sr*0.01)),n=Math.floor(x.length/hop),db=new Float32Array(n);
  for(let i=0;i<n;i++){let s=0;for(let k=i*hop;k<(i+1)*hop;k++)s+=x[k]*x[k];db[i]=20*Math.log10(Math.sqrt(s/hop)+1e-9)}
  const srt=Float32Array.from(db).sort(),thr=srt[Math.floor(n*0.9)]-D,fr=hop/sr,P=[];
  let a0=0,end=n*fr,i=0;
  while(i<n){
    if(db[i]<thr){let j=i;while(j<n&&db[j]<thr)j++;
      if(j-i>=12){ if(i===0)a0=j*fr; else if(j===n)end=i*fr; else P.push([i*fr,j*fr]) }
      i=j;
    }else i++;
  }
  return{P,a0,end};
}
function align(x,sr,lines,D=13){
  const {P,a0,end}=findPauses(x,sr,D),N=lines.length,M=P.length;
  const chars=lines.map(l=>l.t.length),tot=chars.reduce((a,b)=>a+b,0);
  const pd=P.map(p=>p[1]-p[0]),S=(end-a0)-pd.reduce((a,b)=>a+b,0);
  let sp=[],pc=0;P.forEach(p=>{sp.push(p[0]-a0-pc);pc+=p[1]-p[0]});
  const r=tot/S,cost=(i,j0,j1)=>{const d=(j1<M?sp[j1]:S)-(j0>=0?sp[j0]:0),e=chars[i]/r;
    if(d<0.5*e)return 1e6;return (chars[i]+12)*Math.log((d+0.4)/(e+0.4))**2};
  let starts,ends,used=new Set(),ok=N===1||M>=N-1,score=1e9;
  if(ok&&N>1){
    const INF=1e18,dp=[],bk=[];
    for(let i=0;i<N-1;i++){dp.push(new Array(M).fill(INF));bk.push(new Array(M).fill(-1))}
    for(let j=0;j<M;j++)dp[0][j]=cost(0,-1,j)-14*pd[j];
    for(let i=1;i<N-1;i++)for(let j=0;j<M;j++)for(let k=0;k<j;k++)if(dp[i-1][k]<INF){
      const v=dp[i-1][k]+cost(i,k,j)-14*pd[j];if(v<dp[i][j]){dp[i][j]=v;bk[i][j]=k}}
    let bj=-1,bv=INF;for(let j=0;j<M;j++){const v=dp[N-2][j]+cost(N-1,j,M);if(v<bv){bv=v;bj=j}}
    const ch=[bj];for(let i=N-2;i>0;i--){bj=bk[i][bj];ch.push(bj)}ch.reverse();
    ch.forEach(j=>used.add(j));score=0;ch.forEach((j,i)=>{score+=cost(i,i?ch[i-1]:-1,j)});score+=cost(N-1,ch[N-2],M);
    starts=[a0,...ch.map(j=>P[j][1])];ends=[...ch.map(j=>P[j][0]),end];
  }else if(N===1){starts=[a0];ends=[end]}
  else{ // fallback: proportional, no pauses
    let c=0;starts=[];ends=[];lines.forEach((l,i)=>{starts.push(a0+(end-a0)*c/tot);c+=chars[i];ends.push(a0+(end-a0)*c/tot)});
  }
  const out=[];
  lines.forEach((x,i)=>{
    const a=starts[i],b=ends[i],toks=x.t.split(/\s+/).filter(Boolean),w=toks.map(t=>t.length+1);
    const inner=[];if(ok)P.forEach((p,k)=>{if(!used.has(k)&&a+0.6<p[0]&&p[0]<b-0.6)inner.push(k)});
    let pieces;
    if(inner.length&&toks.length>inner.length){
      const pt=inner.reduce((s,k)=>s+pd[k],0),spt=(b-a)-pt,sw=w.reduce((s,v)=>s+v,0),cut=[];
      inner.forEach(k=>{
        const ts=P[k][0]-a-inner.filter(q=>q<k).reduce((s,q)=>s+pd[q],0),target=ts/spt*sw;let c=0;
        for(let n=0;n<toks.length;n++){c+=w[n];if(c>=target){cut.push(n+1);break}}
      });
      const bnd=[0,...cut.map(c=>Math.min(Math.max(c,1),toks.length-1)),toks.length];
      pieces=[];let cur=a;
      for(let n=0;n<bnd.length-1;n++){const pe=n<inner.length?P[inner[n]][0]:b;pieces.push([bnd[n],bnd[n+1],cur,pe]);if(n<inner.length)cur=P[inner[n]][1]}
    }else pieces=[[0,toks.length,a,b]];
    const words=[];
    pieces.forEach(([lo,hi,s,e])=>{if(hi<=lo)return;const ww=w.slice(lo,hi),sw=ww.reduce((q,v)=>q+v,0);let t=s;
      for(let n=lo;n<hi;n++){words.push([toks[n],+t.toFixed(2)]);t+=(e-s)*w[n]/sw}});
    out.push({b:x.b,br:x.br,w:words});
  });
  out.score=score;return out;
}
function alignBest(x,sr,lines){let best=null;for(const D of [9,11,13,15,17,19]){const o=align(x,sr,lines,D);if(!best||o.score<best.score)best=o;}return best}
if(typeof module!=="undefined")module.exports={parseScript,align,alignBest};
