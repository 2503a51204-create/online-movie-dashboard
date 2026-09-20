let DATA = {movies_data:[], users_data:[], streaming_data:[]};
const charts = {};
const $ = id => document.getElementById(id);

function fmt(n){ return new Intl.NumberFormat('en-IN').format(Math.round(Number(n)||0)); }
function money(n){ return '₹' + new Intl.NumberFormat('en-IN',{maximumFractionDigits:0}).format(Number(n)||0); }
function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function unique(arr){ return [...new Set(arr)].filter(Boolean).sort((a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true})); }
function groupSum(rows,key,val){ const m={}; rows.forEach(r=>{const k=r[key]??'Unknown';m[k]=(m[k]||0)+(Number(r[val])||0)}); return m; }
function groupAvg(rows,key,val){ const m={},c={}; rows.forEach(r=>{const k=r[key]??'Unknown'; const v=Number(r[val]); if(Number.isFinite(v)){m[k]=(m[k]||0)+v;c[k]=(c[k]||0)+1}}); Object.keys(m).forEach(k=>m[k]/=c[k]); return m; }
function groupCount(rows,key){ const m={}; rows.forEach(r=>{const k=r[key]??'Unknown';m[k]=(m[k]||0)+1});return m;}

const palette=['#38bdf8','#5eead4','#a78bfa','#fbbf24','#fb7185','#34d399','#60a5fa','#c084fc','#f97316','#22d3ee','#f472b6','#84cc16'];
function destroy(id){ if(charts[id]){charts[id].destroy();delete charts[id];} }
function chart(id,type,labels,values,label,opts={}){
  const el=$(id); if(!el || !window.Chart) return; destroy(id);
  charts[id]=new Chart(el,{type,data:{labels,datasets:[{label,data:values,backgroundColor:type==='line'?'rgba(56,189,248,.16)':palette,borderColor:type==='line'?'#38bdf8':palette,borderWidth:type==='line'?2:1,fill:type==='line',tension:.35,pointRadius:type==='line'?3:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:opts.legend??false,labels:{color:getComputedStyle(document.body).getPropertyValue('--t')}}},scales:type==='doughnut'||type==='pie'?{}:{x:{ticks:{color:getComputedStyle(document.body).getPropertyValue('--m')}},y:{beginAtZero:true,ticks:{color:getComputedStyle(document.body).getPropertyValue('--m')}}},...opts}});
}

function populateSelect(id, vals){ const s=$(id); if(!s)return; const old=s.value; s.innerHTML='<option>All</option>'+vals.map(v=>`<option>${esc(v)}</option>`).join(''); if(vals.includes(old))s.value=old; }
function card(m){return `<article class="card"><div class="poster">🎬</div><h3>${esc(m.title)}</h3><div class="meta">${esc(m.genre)} · ${esc(m.language)} · ${m.year}</div><div class="stats"><span class="rating">★ ${Number(m.rating).toFixed(1)}</span><span>${fmt(m.views)} views</span></div><div class="meta">${money(m.revenue)}</div></article>`}

function renderOverview(){
 const m=DATA.movies_data,u=DATA.users_data,s=DATA.streaming_data;
 $('moviesK').textContent=fmt(m.length); $('usersK').textContent=fmt(u.length); $('streamsK').textContent=fmt(s.length);
 $('viewsK').textContent=fmt(m.reduce((a,r)=>a+r.views,0)); $('ratingK').textContent=(m.reduce((a,r)=>a+r.rating,0)/Math.max(m.length,1)).toFixed(2);
 $('revenueK').textContent=money(m.reduce((a,r)=>a+r.revenue,0)); $('watchK').textContent=fmt(s.reduce((a,r)=>a+r.Watch_Minutes,0)/60); $('activeK').textContent=fmt(u.filter(r=>r.Status==='Active').length);
 const top=[...m].sort((a,b)=>b.views-a.views).slice(0,8); $('topCards').innerHTML=top.map(card).join('');
 const months=groupCount(s,'month'); const monthKeys=Object.keys(months).sort();
 chart('monthly','line',monthKeys,monthKeys.map(k=>months[k]),'Streams');
 const wm=groupSum(s,'month','Watch_Minutes'); chart('watchTrend','line',monthKeys,monthKeys.map(k=>(wm[k]||0)/60),'Watch hours');
 const vg=groupSum(m,'genre','views'); const rg=groupSum(m,'genre','revenue'); const g=Object.keys(vg).sort((a,b)=>vg[b]-vg[a]);
 chart('viewsGenre','bar',g,g.map(k=>vg[k]),'Views'); chart('revGenre','bar',Object.keys(rg).sort((a,b)=>rg[b]-rg[a]),Object.keys(rg).sort((a,b)=>rg[b]-rg[a]).map(k=>rg[k]),'Revenue');
 const plans=groupCount(u,'Plan'); chart('plans','doughnut',Object.keys(plans),Object.values(plans),'Users',{legend:true});
 const dev=groupCount(u,'Device'); chart('devices','bar',Object.keys(dev),Object.values(dev),'Users');
}

function renderMovies(){
 const m=DATA.movies_data, genre=$('mg').value, lang=$('ml').value, year=$('my').value, min=Number($('mr').value)||0;
 const rows=m.filter(x=>(genre==='All'||x.genre===genre)&&(lang==='All'||x.language===lang)&&(year==='All'||String(x.year)===year)&&x.rating>=min);
 $('movieCount').textContent=`Showing ${fmt(rows.length)} of ${fmt(m.length)} movies`;
 $('movieRows').innerHTML=rows.slice(0,300).map(x=>`<tr><td><b>${esc(x.title)}</b></td><td>${esc(x.genre)}</td><td>${esc(x.language)}</td><td>${x.year}</td><td>★ ${x.rating.toFixed(1)}</td><td>${fmt(x.views)}</td><td>${money(x.revenue)}</td></tr>`).join('');
}
function renderTrending(){
 const m=DATA.movies_data; let a=[...m].sort((x,y)=>y.views-x.views).slice(0,12); chart('topViews','bar',a.map(x=>x.title),a.map(x=>x.views),'Views',{indexAxis:'y'}); a=[...m].sort((x,y)=>y.revenue-x.revenue).slice(0,12); chart('topRevenue','bar',a.map(x=>x.title),a.map(x=>x.revenue),'Revenue',{indexAxis:'y'}); $('ratedCards').innerHTML=[...m].sort((x,y)=>y.rating-x.rating).slice(0,8).map(card).join(''); }
function renderUsers(){
 const u=DATA.users_data; let c=groupCount(u,'Country'); let keys=Object.keys(c).sort((a,b)=>c[b]-c[a]).slice(0,12); chart('countries','bar',keys,keys.map(k=>c[k]),'Users');
 const ageBins={'<18':0,'18-24':0,'25-34':0,'35-44':0,'45-54':0,'55+':0};u.forEach(x=>{let a=Number(x.Age); if(a<18)ageBins['<18']++;else if(a<25)ageBins['18-24']++;else if(a<35)ageBins['25-34']++;else if(a<45)ageBins['35-44']++;else if(a<55)ageBins['45-54']++;else ageBins['55+']++;}); chart('ages','bar',Object.keys(ageBins),Object.values(ageBins),'Users');
 c=groupCount(u,'Plan');chart('userPlans','doughnut',Object.keys(c),Object.values(c),'Users',{legend:true});c=groupCount(u,'Device');chart('userDevices','bar',Object.keys(c),Object.values(c),'Users');
}
function renderStreaming(){
 const s=DATA.streaming_data; $('sc').textContent=fmt(s.length); $('sh').textContent=fmt(s.reduce((a,r)=>a+r.Watch_Minutes,0)/60); $('scomp').textContent=(s.reduce((a,r)=>a+r.Completion_Percent,0)/Math.max(s.length,1)).toFixed(1)+'%';
 const d=groupCount(s,'date'), dk=Object.keys(d).sort(); chart('daily','line',dk.slice(-31),dk.slice(-31).map(k=>d[k]),'Streams');
 const bins={'0–25%':0,'26–50%':0,'51–75%':0,'76–100%':0};s.forEach(x=>{let v=Number(x.Completion_Percent); if(v<=25)bins['0–25%']++;else if(v<=50)bins['26–50%']++;else if(v<=75)bins['51–75%']++;else bins['76–100%']++;});chart('completion','doughnut',Object.keys(bins),Object.values(bins),'Streams',{legend:true});
 let c=groupCount(s,'Device');chart('streamDevices','bar',Object.keys(c),Object.values(c),'Streams'); c=groupSum(s,'genre','Watch_Minutes'); const k=Object.keys(c).sort((a,b)=>c[b]-c[a]);chart('watchGenre','bar',k,k.map(x=>c[x]/60),'Hours');
}
function renderGenres(){ const m=DATA.movies_data,s=DATA.streaming_data; let c=groupCount(m,'genre'),k=Object.keys(c).sort((a,b)=>c[b]-c[a]);chart('gMovies','bar',k,k.map(x=>c[x]),'Movies');c=groupAvg(m,'genre','rating');k=Object.keys(c).sort();chart('gRating','bar',k,k.map(x=>c[x]),'Rating');c=groupSum(m,'genre','views');k=Object.keys(c).sort((a,b)=>c[b]-c[a]);chart('gViews','bar',k,k.map(x=>c[x]),'Views');c=groupSum(m,'genre','revenue');k=Object.keys(c).sort((a,b)=>c[b]-c[a]);chart('gRevenue','bar',k,k.map(x=>c[x]),'Revenue');c=groupSum(s,'genre','Watch_Minutes');k=Object.keys(c).sort((a,b)=>c[b]-c[a]);chart('gWatch','bar',k,k.map(x=>c[x]/60),'Hours');const completion={};const counts={};s.forEach(x=>{const k=x.genre;completion[k]=(completion[k]||0)+(Number(x.Completion_Percent)||0);counts[k]=(counts[k]||0)+1});k=Object.keys(completion).sort();chart('gCompletion','bar',k,k.map(x=>completion[x]/counts[x]),'Completion %'); }
function renderRevenue(){ const m=DATA.movies_data;let c=groupSum(m,'genre','revenue'),k=Object.keys(c).sort((a,b)=>c[b]-c[a]);chart('rGenre','bar',k,k.map(x=>c[x]),'Revenue');c=groupSum(m,'country','revenue');k=Object.keys(c).sort((a,b)=>c[b]-c[a]).slice(0,12);chart('rCountry','bar',k,k.map(x=>c[x]),'Revenue');chart('scatter1','scatter',[],[],'',{parsing:false,scales:{x:{title:{display:true,text:'Views',color:'#9db0c8'}},y:{title:{display:true,text:'Revenue',color:'#9db0c8'}}}}); chart('scatter2','scatter',[],[],'',{parsing:false,scales:{x:{title:{display:true,text:'Rating',color:'#9db0c8'}},y:{title:{display:true,text:'Revenue',color:'#9db0c8'}}}}); const c1=charts.scatter1,c2=charts.scatter2;c1.data.datasets=[{label:'Movies',data:m.map(x=>({x:x.views,y:x.revenue})),backgroundColor:'#38bdf8',pointRadius:3}];c2.data.datasets=[{label:'Movies',data:m.map(x=>({x:x.rating,y:x.revenue})),backgroundColor:'#a78bfa',pointRadius:3}];c1.update();c2.update(); }
function renderSearch(){ const m=DATA.movies_data,q=($('searchInput').value||'').toLowerCase().trim(),g=$('sg').value,l=$('sl').value,min=Number($('sr').value)||0;const rows=m.filter(x=>(!q||[x.title,x.genre,x.language,x.country,String(x.year)].some(v=>String(v).toLowerCase().includes(q)))&&(g==='All'||x.genre===g)&&(l==='All'||x.language===l)&&x.rating>=min);$('searchCount').textContent=`Found ${fmt(rows.length)} movies`;$('results').innerHTML=rows.slice(0,60).map(card).join(''); }

function showPage(name){ document.querySelectorAll('.page').forEach(p=>p.classList.toggle('hidden',p.id!==name));document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.page===name));window.scrollTo({top:0,behavior:'smooth'}); if(window.innerWidth<=800)$('sidebar').classList.remove('open'); }

async function load(){
 try{ const r=await fetch('/api/summary'); if(!r.ok)throw new Error('API '+r.status); DATA=await r.json();
  populateSelect('mg',unique(DATA.movies_data.map(x=>x.genre)));populateSelect('ml',unique(DATA.movies_data.map(x=>x.language)));populateSelect('my',unique(DATA.movies_data.map(x=>x.year)).sort((a,b)=>b-a));populateSelect('sg',unique(DATA.movies_data.map(x=>x.genre)));populateSelect('sl',unique(DATA.movies_data.map(x=>x.language)));
  renderOverview();renderMovies();renderTrending();renderUsers();renderStreaming();renderGenres();renderRevenue();renderSearch();
 }catch(e){console.error(e);$('main').insertAdjacentHTML('afterbegin',`<div class="error">Unable to load Excel data. Check the Flask terminal. ${esc(e.message)}</div>`);}
}

// Navigation works without page reload.
document.addEventListener('click',e=>{const nav=e.target.closest('.nav,[data-go]');if(nav){e.preventDefault();showPage(nav.dataset.page||nav.dataset.go);}});
$('menu').addEventListener('click',()=> $('sidebar').classList.toggle('open'));
$('theme').addEventListener('click',()=>{document.body.classList.toggle('light');localStorage.setItem('cine-theme',document.body.classList.contains('light')?'light':'dark');});
if(localStorage.getItem('cine-theme')==='light')document.body.classList.add('light');
$('help').addEventListener('click',()=> $('modal').classList.remove('hidden'));$('close').addEventListener('click',()=> $('modal').classList.add('hidden'));$('modal').addEventListener('click',e=>{if(e.target.id==='modal')$('modal').classList.add('hidden')});
$('globalSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){showPage('search');$('searchInput').value=e.target.value;renderSearch();}});
['mg','ml','my','mr'].forEach(id=>$(id).addEventListener('input',renderMovies));['searchInput','sg','sl','sr'].forEach(id=>$(id).addEventListener('input',renderSearch));
window.addEventListener('resize',()=>{if(window.innerWidth>800)$('sidebar').classList.remove('open')});
load();
