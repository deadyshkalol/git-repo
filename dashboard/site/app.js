function start(D){
const days=D.days||[];
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const MON=['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
const fd=s=>{const [y,m,d]=s.split('-').map(Number);return d+' '+MON[m-1]};
const num=(v,dg=0)=>v==null||isNaN(v)?'—':Number(v).toLocaleString('ru-RU',{minimumFractionDigits:dg,maximumFractionDigits:dg});
const vals=k=>days.map(r=>r[k]).filter(v=>v!=null&&!isNaN(v));
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
const last=k=>{for(let i=days.length-1;i>=0;i--)if(days[i][k]!=null)return days[i][k];return null};
const avgLast=(k,n)=>mean(days.slice(-n).map(r=>r[k]).filter(v=>v!=null));
const NS='http://www.w3.org/2000/svg';
const el=(t,a,p)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);p&&p.appendChild(e);return e};

// Header
document.getElementById('sample').hidden=!D.sample;
if(D.updated){const t=new Date(D.updated);document.getElementById('updated').textContent='Обновлено '+t.toLocaleString('ru-RU',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'});}
const R=D.readiness||{};const pill=document.getElementById('pill');
const cname={green:'Зелёный',yellow:'Жёлтый',red:'Красный'};
pill.textContent=cname[R.color]||'Нет оценки';pill.className='pill '+(R.color||'');
document.getElementById('headline').textContent=R.headline||'';
document.getElementById('why').textContent=R.why||'';

// Tiles
const hrvKey=vals('hrv').length?'hrv':'hrvSDNN';
if(hrvKey==='hrvSDNN')document.getElementById('hrvlabel').textContent='HRV Apple (SDNN), мс';
function tile(k,v,d,cls){const t=document.createElement('div');t.className='tile';
  const a=document.createElement('div');a.className='k';a.textContent=k;
  const b=document.createElement('div');b.className='v';b.textContent=v;
  const c=document.createElement('div');c.className='d '+(cls||'mut');c.textContent=d;t.append(a,b,c);return t}
const tiles=document.getElementById('tiles');
{const n=mean(vals(hrvKey)),a=avgLast(hrvKey,3);const p=n&&a?a/n:null;
 tiles.append(tile('HRV, 3 дня',num(a),p?Math.round(p*100)+'% нормы ('+num(n)+')':'нет данных',p==null?'':p<.75?'badc':p<.85?'warnc':'good'));}
{const n=mean(vals('restingHR')),v=last('restingHR');const dlt=n&&v?v-n:null;
 tiles.append(tile('Пульс покоя',num(v),dlt==null?'нет данных':(dlt>=0?'+':'−')+num(Math.abs(dlt),1)+' к норме '+num(n),dlt==null?'':dlt>=6?'badc':dlt>=4?'warnc':'good'));}
{const v=last('sleepHours'),s=last('sleepScore');
 tiles.append(tile('Сон',v==null?'—':num(v,1)+' ч',s==null?'оценка —':'оценка '+num(s),s==null?'':s<60?'badc':s<75?'warnc':'good'));}
{const v=last('tsb'),c=last('ctl');
 tiles.append(tile('TSB',v==null?'—':(v>0?'+':'')+num(v,1),'CTL '+num(c,1)+', ATL '+num(last('atl'),1),'mut'));}

// Generic chart
function niceTicks(lo,hi,n){const span=hi-lo||1;const step0=span/n;const mag=Math.pow(10,Math.floor(Math.log10(step0)));const err=step0/mag;const step=(err>=7.5?10:err>=3.5?5:err>=1.5?2:1)*mag;const out=[];for(let v=Math.ceil(lo/step)*step;v<=hi+1e-9;v+=step)out.push(+v.toFixed(10));return out}
function draw(host,o){
  host.replaceChildren();
  const rows=o.rows||days;
  const has=o.series.some(s=>rows.some(r=>r[s.key]!=null));
  if(!has)return false;
  const W=Math.max(220,host.clientWidth),H=o.h||170,m={l:34,r:o.endLabel===false?8:34,t:10,b:20};
  const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,height:H,role:'img','aria-label':o.aria||''},host);
  const all=[];o.series.forEach(s=>rows.forEach(r=>{let v=r[s.key];if(v!=null){if(s.stackOn)v+= (r[s.stackOn]||0);all.push(v)}}));
  (o.refs||[]).forEach(f=>f.y!=null&&all.push(f.y));
  let lo=Math.min(...all),hi=Math.max(...all);
  if(o.zero){lo=Math.min(0,lo)}else{const pad=(hi-lo||Math.abs(hi)||1)*.15;lo-=pad;hi+=pad}
  if(o.zero)hi+= (hi-lo)*.08;
  const ticks=niceTicks(lo,hi,o.h&&o.h<120?2:4);lo=Math.min(lo,ticks[0]);hi=Math.max(hi,ticks[ticks.length-1]);
  const n=rows.length,iw=W-m.l-m.r,ih=H-m.t-m.b,bw=iw/n;
  const X=i=>m.l+bw*(i+.5),Y=v=>m.t+ih*(1-(v-lo)/(hi-lo||1));
  ticks.forEach(t=>{el('line',{x1:m.l,x2:W-m.r,y1:Y(t),y2:Y(t),stroke:css('--grid'),'stroke-width':1},svg);const tx=el('text',{x:m.l-5,y:Y(t)+3,'text-anchor':'end'},svg);tx.textContent=num(t,o.tickDigits||0)});
  const lab=n<8||iw<200?[0,n-1]:[0,Math.floor((n-1)/2),n-1];[...new Set(lab)].forEach(i=>{const tx=el('text',{x:X(i),y:H-4,'text-anchor':i===0?'start':i===n-1?'end':'middle'},svg);tx.textContent=o.xLabel?o.xLabel(rows[i]):fd(rows[i].date)});
  (o.refs||[]).forEach(f=>{if(f.y==null)return;el('line',{x1:m.l,x2:W-m.r,y1:Y(f.y),y2:Y(f.y),stroke:css(f.color||'--slate'),'stroke-width':1.2,'stroke-dasharray':'4 4'},svg)});
  const used=[];
  o.series.forEach(s=>{
    const col=s.colorFn?null:css(s.color);
    if(s.kind==='bar'){rows.forEach((r,i)=>{const v=r[s.key];if(v==null)return;const base=s.stackOn?(r[s.stackOn]||0):0;const y0=Y(Math.max(o.zero?0:lo,base)),y1=Y(base+v);const bwid=Math.max(2,bw*.62);
      el('rect',{x:X(i)-bwid/2,y:Math.min(y0,y1),width:bwid,height:Math.max(1,Math.abs(y0-y1)),rx:2,fill:s.colorFn?css(s.colorFn(r)):col,opacity:s.opacity||1},svg)})}
    else{let d='',pts=[];rows.forEach((r,i)=>{const v=r[s.key];if(v==null)return;pts.push([X(i),Y(v),v]);d+=(d?'L':'M')+X(i).toFixed(1)+','+Y(v).toFixed(1)});
      el('path',{d,fill:'none',stroke:col,'stroke-width':2,'stroke-linejoin':'round','stroke-linecap':'round'},svg);
      if(pts.length<=12)pts.forEach(p=>el('circle',{cx:p[0],cy:p[1],r:2.2,fill:col},svg));
      const p=pts[pts.length-1];if(p){el('circle',{cx:p[0],cy:p[1],r:4,fill:col,stroke:css('--panel'),'stroke-width':2},svg);
        if(o.endLabel!==false){let ly=p[1]+3;used.forEach(u=>{if(Math.abs(u-ly)<11)ly=ly>=u?u+11:u-11});used.push(ly);const tx=el('text',{x:p[0]+7,y:ly,style:`fill:${col};font-weight:600`},svg);tx.textContent=num(p[2],s.digits||0)}}}
  });
  // tooltip
  const tip=document.createElement('div');tip.className='tip';tip.hidden=true;host.append(tip);
  const cur=el('line',{y1:m.t,y2:H-m.b,stroke:css('--line'),'stroke-width':1,visibility:'hidden'},svg);
  function show(ev){const rc=svg.getBoundingClientRect();const x=(ev.clientX-rc.left)*W/rc.width;let i=Math.round((x-m.l)/bw-.5);i=Math.max(0,Math.min(n-1,i));const r=rows[i];
    cur.setAttribute('x1',X(i));cur.setAttribute('x2',X(i));cur.setAttribute('visibility','visible');
    tip.replaceChildren();const b=document.createElement('b');b.textContent=o.xLabel?o.xLabel(r,true):fd(r.date);tip.append(b);
    (o.tipRows?o.tipRows(r):o.series.map(s=>[s.label,r[s.key],s.digits])).forEach(([l,v,dg])=>{const dv=document.createElement('div');dv.textContent=l+': '+(v==null?'—':(typeof v==='string'?v:num(v,dg||0)));tip.append(dv)});
    tip.hidden=false;const px=X(i)*rc.width/W;const tw=tip.offsetWidth;tip.style.left=Math.max(0,Math.min(rc.width-tw,px-tw/2))+'px';tip.style.top='-6px';tip.style.transform='translateY(-100%)'}
  svg.addEventListener('pointermove',show);svg.addEventListener('pointerdown',show);
  svg.addEventListener('pointerleave',()=>{tip.hidden=true;cur.setAttribute('visibility','hidden')});
}

// Weekly volume
function weeks(){const map=new Map();days.forEach(r=>{const d=new Date(r.date+'T00:00:00Z');const wd=(d.getUTCDay()+6)%7;const mon=new Date(d.getTime()-wd*864e5).toISOString().slice(0,10);
  if(!map.has(mon))map.set(mon,{date:mon,ride:0,run:0,km:0,days:0});const w=map.get(mon);w.ride+=(r.rideMin||0)/60;w.run+=(r.runMin||0)/60;w.km+=r.runKm||0;w.days++});
  return [...map.values()].map(w=>({...w,ride:+w.ride.toFixed(2),run:+w.run.toFixed(2),total:+(w.ride+w.run).toFixed(2)}))}
const W=weeks();

const mHRV=mean(vals(hrvKey)),mRHR=mean(vals('restingHR')),mSHR=mean(vals('avgSleepingHR'));
const charts={
  form:{series:[{key:'tsb',label:'TSB',kind:'bar',color:'--slate',opacity:.45,digits:1},{key:'ctl',label:'CTL',color:'--teal',digits:1},{key:'atl',label:'ATL',color:'--heart',digits:1}],zero:true,aria:'CTL, ATL и TSB за 28 дней'},
  volume:{rows:W,series:[{key:'ride',label:'Велосипед, ч',kind:'bar',color:'--teal',digits:1},{key:'run',label:'Бег, ч',kind:'bar',color:'--amber',stackOn:'ride',digits:1}],zero:true,endLabel:false,tickDigits:1,
    xLabel:(w,full)=>(full?'Неделя с ':'')+fd(w.date),tipRows:w=>[['Велосипед, ч',w.ride,1],['Бег, ч',w.run,1],['Бег, км',w.km,1],['Всего, ч',w.total,1]],aria:'Часы тренировок по неделям'},
  hrv:{series:[{key:hrvKey,label:'HRV, мс'}].map(s=>({...s,color:'--teal'})),refs:[{y:mHRV},{y:mHRV&&mHRV*.85,color:'--warn'},{y:mHRV&&mHRV*.75,color:'--bad'}],aria:'HRV за 28 дней'},
  hr:{series:[{key:'restingHR',label:'Пульс покоя',color:'--heart'},{key:'avgSleepingHR',label:'Пульс во сне',color:'--sleep'}],refs:[{y:mRHR},{y:mRHR&&mRHR+4,color:'--warn'}],aria:'Пульс покоя и во сне'},
  sleep:{series:[{key:'sleepHours',label:'Сон, ч',kind:'bar',digits:1,colorFn:r=>r.sleepScore==null?'--slate':r.sleepScore<60?'--bad':r.sleepScore<75?'--warn':'--ok'}],refs:[{y:7}],zero:true,endLabel:false,
    tipRows:r=>[['Сон, ч',r.sleepHours,1],['Оценка',r.sleepScore]],aria:'Сон по ночам'},
  vo2:{h:110,series:[{key:'vo2max',label:'VO2max',color:'--teal',digits:1}],tickDigits:1,emptyText:'Нет данных с часов'},
  weight:{h:110,series:[{key:'weight',label:'Вес, кг',color:'--slate',digits:1}],tickDigits:1,emptyText:'Нет данных с часов'},
};
// Sparse series (weight, vo2) — connect only measured days
function render(){document.querySelectorAll('[data-chart]').forEach(h=>{const o=charts[h.dataset.chart];if(!o)return;
  if(['vo2','weight'].includes(h.dataset.chart)){const k=o.series[0].key;o.rows=days.filter(r=>r[k]!=null)}
  const ok=draw(h,o)!==false;const box=h.closest('.mini')||h.closest('section.card');box.hidden=!ok});
  document.querySelectorAll('section.card').forEach(c=>{const m=c.querySelectorAll('.mini');if(m.length)c.hidden=[...m].every(x=>x.hidden)});
  const shr=vals('avgSleepingHR').length>0;const lg=document.getElementById('lg-shr');if(lg)lg.hidden=!shr;
  const ht=document.getElementById('hr-title');if(ht)ht.textContent=shr?'Пульс покоя и пульс во сне':'Пульс покоя'}
// Workouts table
(function(){const W=(D.workouts||[]).slice().sort((a,b)=>a.date<b.date?1:-1);const body=document.getElementById('work-body');const sec=document.getElementById('c-work');
  if(!W.length){sec.hidden=true;return}
  W.forEach(w=>{const tr=document.createElement('tr');const run=w.type==='run';
    const cells=[fd(w.date),null,w.min==null?'—':Math.round(w.min)+' мин',w.km==null?'—':num(w.km,1),w.avgHR==null?'—':Math.round(w.avgHR),
      run?(w.pace||'—'):(w.avgW==null?'—':Math.round(w.avgW)+' Вт'),w.decoupling==null?'—':num(w.decoupling,1)+'%'];
    cells.forEach((c,i)=>{const td=document.createElement('td');if(i===1){const t=document.createElement('span');t.className='tag '+(run?'run':'ride');t.textContent=run?'Бег':'Вело';td.append(t)}else{td.textContent=c;if(i>1)td.className='n'}
      if(i===6&&w.decoupling!=null)td.classList.add(w.decoupling>10?'badc':w.decoupling>5?'warnc':'good');tr.append(td)});body.append(tr)})})();
render();
let raf;const ro=new ResizeObserver(()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(render)});ro.observe(document.querySelector('.wrap'));
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',render);
new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
}
fetch('data.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(start).catch(e=>{document.getElementById('headline').textContent='Данные не загрузились: '+e.message});
