const $=id=>document.getElementById(id);
const fmt=s=>{s=Math.max(0,s|0);return(s/60|0)+":"+String(s%60).padStart(2,"0")};
function readList(file){
 return fetch(file+"?"+Date.now()).then(r=>{if(!r.ok)throw 0;return r.text()}).then(t=>
  t.split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&l[0]!=="#"&&l.includes("|")).map(l=>l.split("|").map(s=>s.trim())));
}
function embedInfo(u){
 let m;
 if(m=u.match(/instagram\.com\/(?:[^\/?]+\/)?(p|reels?|tv)\/([\w-]+)/))return{src:"https://www.instagram.com/"+(m[1]==="reels"?"reel":m[1])+"/"+m[2]+"/embed/",type:"ig"};
 if(m=u.match(/drive\.google\.com\/file\/d\/([\w-]+)/)||u.match(/drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([\w-]+)/))return{src:"https://drive.google.com/file/d/"+m[1]+"/preview",type:"drive"};
 if(m=u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/))([\w-]{11})/))return{src:"https://www.youtube-nocookie.com/embed/"+m[1],type:"yt"};
 return null;
}
function buildEmbed(url,wide){
 const i=embedInfo(url),w=document.createElement("div");w.className="vid";
 if(i){const fr=document.createElement("div");fr.className="frame "+(i.type==="ig"?"ig":wide?"w":"v");
  const f=document.createElement("iframe");f.src=i.src;f.title="Video";f.loading="lazy";f.allowFullscreen=true;
  f.allow="autoplay; fullscreen; picture-in-picture; encrypted-media";fr.append(f);w.append(fr)}
 const a=document.createElement("a");a.className="btn";a.href=url;a.target="_blank";a.rel="noopener";
 a.textContent=!i?"Open the video":i.type==="ig"?"Open on Instagram":i.type==="drive"?"Open in Google Drive":"Open on YouTube";
 w.append(a);return w;
}
function listPage(file,hrefFor,titleIdx,emptyMsg,errMsg){
 const box=$("list");
 readList(file).then(rows=>{
  if(!rows.length){box.innerHTML='<div class="card msg"></div>';box.firstChild.textContent=emptyMsg;return}
  rows.map((r,i)=>({r,n:i+1})).reverse().forEach(({r,n})=>{
   const a=document.createElement("a");a.className="card row";a.href=hrefFor(r,n);
   const s=document.createElement("span");s.className="num";s.textContent=String(n).padStart(2,"0");
   const h=document.createElement("span");h.className="ttl";h.textContent=r[titleIdx];a.append(s,h);box.append(a)});
 }).catch(()=>{box.innerHTML='<div class="card msg"></div>';box.firstChild.textContent=errMsg});
}
if(typeof module!=="undefined")module.exports={embedInfo};
