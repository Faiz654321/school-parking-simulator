const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const LS={get(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const show=id=>$$('.screen').forEach(s=>s.classList.toggle('active',s.id===id));
const say=(el,t,c)=>{el.textContent=t;el.className='msg '+(c||'')};
/* ===== MENU & PROGRES (tanpa login) ===== */
const USER=(typeof GameHub!=='undefined'&&GameHub.currentUser())||null,KEY='sp_progress_'+(USER?USER.username:'tamu'); // progres tersimpan per akun login
const prog=()=>LS.get(KEY,{lvl:0,best:0});
function menu(){const p=prog();
  $('#m-sub').textContent='School Parking Simulator · '+SCHOOL;$('#m-badge').textContent='Lv '+(p.lvl+1);$('#m-kelas').textContent='Petugas: '+(USER?USER.username:'tamu');
  $('#m-best').textContent=p.best;$('#m-plays').textContent=(p.lvl+1)+'/'+LV.length;show('menu')}
$('#b-help').onclick=()=>$('#help').showModal();
$('#b-levels').onclick=()=>{const p=prog();
  $('#lv-grid').innerHTML=LV.map((l,i)=>`<button class="lvb" data-i="${i}" ${i>p.lvl?'disabled':''}>${i+1}</button>`).join('');$('#levels').showModal()};
$('#lv-grid').onclick=e=>{const b=e.target.closest('[data-i]');if(!b||b.disabled)return;$('#levels').close();total=0;start(+b.dataset.i)};

/* ===== GAME: Parkir Belakang Sekolah ===== */
const SCHOOL='SMKN 71'; // ganti dengan nama sekolah kelompok kalian
const CW=360,CH=560,LI=14,LO=45,QY=[460,510,560]; // jarak antrean 50 > panjang mobil (46) supaya tidak menumpuk
/* 2 petugas parkir: satu khusus area mobil, satu khusus area motor */
const PET={car:{post:[347,189],name:'Petugas Mobil',col:'#ff8c1a'},bike:{post:[347,372],name:'Petugas Motor',col:'#19b36b'}};
const mkPet=k=>({k,x:PET[k].post[0],y:PET[k].post[1],a:0,path:[],wave:0});
const LV=[
 {t:90,tg:1000,sp:5.5,mn:4.2,pat:15,hp:5,rush:0,pk:[10,18],ex:9,n:'Pagi hari, masih sepi'},
 {t:95,tg:1400,sp:5,mn:3.8,pat:14,hp:5,rush:0,pk:[10,18],ex:9,n:'Hari sekolah biasa'},
 {t:100,tg:1800,sp:4.7,mn:3.5,pat:13,hp:5,rush:.08,pk:[10,17],ex:9,n:'Guru piket datang pagi'},
 {t:105,tg:2300,sp:4.4,mn:3.2,pat:12,hp:4,rush:.1,pk:[9,16],ex:8,n:'Hari ujian'},
 {t:110,tg:2800,sp:4.1,mn:3,pat:11,hp:4,rush:.12,pk:[9,15],ex:8,n:'Pembagian rapor'},
 {t:115,tg:3300,sp:3.8,mn:2.8,pat:10,hp:4,rush:.15,pk:[8,14],ex:7,n:'Rapat orang tua murid'},
 {t:120,tg:3900,sp:3.5,mn:2.6,pat:9,hp:3,rush:.18,pk:[8,13],ex:7,n:'Lomba antarsekolah'},
 {t:125,tg:4500,sp:3.2,mn:2.4,pat:8.5,hp:3,rush:.2,pk:[7,12],ex:6,n:'Pentas seni'},
 {t:130,tg:5100,sp:3,mn:2.2,pat:8,hp:3,rush:.22,pk:[7,11],ex:6,n:'Wisuda kelulusan'},
 {t:140,tg:5800,sp:2.8,mn:2,pat:7,hp:3,rush:.25,pk:[6,10],ex:5,n:'Hari akreditasi, super padat'}];
const SC={car:{w:24,h:40,k:1.15,t:'mobil'},bike:{w:14,h:30,k:1.25,t:'motor'}};
const COLS={car:['#e05555','#4aa3ff','#b07cff','#f08a3c','#d8d8d8','#3cc2a5','#2d3a8c','#f2c94c'],bike:['#ff7a1a','#e05555','#2d7ff9','#333','#3cc2a5','#b07cff']};
const rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
const cv=$('#cv'),ctx=cv.getContext('2d');
let G,VS,Q,P,FT,raf,last=0,tt=0,AC,lvl=0,total=0,L=LV[0];
const beep=(f,d)=>{try{AC=AC||new AudioContext();const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=f;g.gain.value=.05;o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+d)}catch{}};

const UL={car:[[0,0,0,1,2],[3,4,5,6,7]],bike:[[0,0,0,1,1,2],[3,3,4,5,6,7]]};
const SLOTS=[];
(()=>{const add=(t,ys,n,w,h,ly)=>ys.forEach((y,r)=>{for(let i=0;i<n;i++){const x=60+i*w;SLOTS.push({t,x,y,w,h,cx:x+w/2,cy:y+h/2,ly,a:r?Math.PI:0,v:null,fl:0,ok:1,lv:UL[t][r][i]})}});
  add('car',[108,204],5,56,66,189);add('bike',[306,384],6,280/6,54,372)})();

/* latar: belakang sekolah (digambar sekali) */
function tree(g,x,y,r){g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(x+r*.25,y+r*.3,r,r*.85,0,0,7);g.fill();
  for(const[dx,dy,k,c]of[[0,0,1,'#2b6a35'],[-.25,-.2,.72,'#3a8a45'],[.15,-.3,.5,'#56ad5a'],[-.1,-.4,.3,'#7cc873']]){g.fillStyle=c;g.beginPath();g.arc(x+dx*r,y+dy*r,r*k,0,7);g.fill()}}
const BG=document.createElement('canvas');BG.width=CW;BG.height=CH;
(()=>{const g=BG.getContext('2d');
 g.fillStyle='#4f8a3a';g.fillRect(0,0,CW,CH);
 for(let i=0;i<500;i++){g.fillStyle=i%2?'#589a41':'#468032';g.fillRect(Math.random()*CW,Math.random()*CH,2,3)}
 g.fillStyle='#b5523b';g.fillRect(0,0,CW,9);g.fillStyle='#e6d5b0';g.fillRect(0,9,CW,53);g.fillStyle='#8c7a5a';g.fillRect(0,56,CW,6);
 for(const wx of[14,62,252,300]){g.fillStyle='#6e5b3a';g.fillRect(wx-2,17,40,24);g.fillStyle='#7ec3e8';g.fillRect(wx,19,17,20);g.fillRect(wx+19,19,17,20)}
 g.fillStyle='#6b4a2f';g.fillRect(158,24,44,38);g.fillStyle='#8a6340';g.fillRect(162,28,17,34);g.fillRect(181,28,17,34);g.fillStyle='#bdb7a5';g.fillRect(150,62,60,5);
 g.fillStyle='#2f6b3c';g.fillRect(112,11,136,11);g.fillStyle='#fff';g.font='bold 8px sans-serif';g.textAlign='center';g.fillText('BELAKANG '+SCHOOL,180,19.5);
 g.fillStyle='#3f7a30';for(const x of[100,128,236,264]){g.beginPath();g.arc(x,92,7,0,7);g.fill()}
 g.fillStyle='#464b53';g.fillRect(0,100,340,424);g.fillRect(0,524,60,36);
 for(let i=0;i<500;i++){g.fillStyle=i%2?'#4d535b':'#40454c';g.fillRect(Math.random()*334,100+Math.random()*424,2,2)}
 g.fillStyle='rgba(74,163,255,.12)';g.fillRect(60,100,280,176);g.fillStyle='rgba(56,210,122,.12)';g.fillRect(60,302,280,142);
 g.fillStyle='#bdb7a5';g.fillRect(60,276,280,26);g.fillStyle='#4f8a3a';g.fillRect(62,278,276,22);
 for(let i=0;i<30;i++){g.fillStyle=i%2?'#ff6b8a':'#ffd23f';g.fillRect(66+Math.random()*268,280+Math.random()*18,3,3)}
 g.strokeStyle='rgba(255,201,51,.7)';g.lineWidth=2;g.setLineDash([8,8]);g.beginPath();g.moveTo(30,100);g.lineTo(30,560);g.stroke();g.setLineDash([]);
 g.fillStyle='rgba(255,255,255,.6)';g.font='bold 9px sans-serif';g.fillText('AREA PARKIR MOBIL',184,192);g.fillText('AREA PARKIR MOTOR',184,375);
 g.font='bold 6.5px sans-serif';g.fillText('MASUK',LI,516);g.fillText('KELUAR',LO,516);
 const arrow=(x,y,d)=>{g.beginPath();g.moveTo(x,y+d*8);g.lineTo(x-6,y);g.lineTo(x+6,y);g.closePath();g.fill();g.fillRect(x-2,d>0?y-8:y,4,8)};
 g.fillStyle='rgba(255,255,255,.5)';for(const yy of[150,250,350,440]){arrow(LI,yy,-1);arrow(LO,yy+30,1)}
 for(const s of SLOTS){g.strokeStyle='#e8e8e8';g.lineWidth=2;g.strokeRect(s.x,s.y,s.w,s.h);g.fillStyle='#e0b020';g.fillRect(s.cx-10,s.a?s.y+s.h-5:s.y+2,20,3);
  g.globalAlpha=.3;g.font='bold 9px sans-serif';g.fillStyle='#fff';g.fillText(s.t==='car'?'MOBIL':'MOTOR',s.cx,s.cy+3);g.globalAlpha=1}
 
 /* === GAMBAR SAJA (belum ada gameplay): lahan Mobil MBG & Tamu Sekolah === */
 const rb=(x,y,w,h,r,c)=>{g.fillStyle=c;g.beginPath();g.roundRect?g.roundRect(x,y,w,h,r):g.rect(x,y,w,h);g.fill()};
 g.fillStyle='rgba(255,159,26,.16)';g.fillRect(204,452,66,68);g.fillStyle='rgba(160,120,255,.16)';g.fillRect(274,452,60,68);
 g.strokeStyle='#e8e8e8';g.lineWidth=2;g.strokeRect(204,452,66,68);g.strokeRect(274,452,60,32);g.strokeRect(274,488,60,32);
 g.strokeStyle='rgba(255,201,51,.55)';g.lineWidth=2;for(let k=0;k<4;k++){g.beginPath();g.moveTo(206,470+k*12);g.lineTo(220+k*0,458+k*12);g.stroke()}
 rb(204,440,66,11,3,'#2f9e44');rb(274,440,60,11,3,'#3b5bdb');
 g.fillStyle='#fff';g.font='bold 7px sans-serif';g.textAlign='center';g.fillText('MOBIL MBG',237,448);g.fillText('TAMU SEKOLAH',304,448);
 /* truk MBG */
 rb(236,456,34,64,6,'rgba(0,0,0,.25)');
 rb(222,455,30,15,4,'#f4f4f4');rb(225,458,24,6,2,'#1b2a3a');rb(221,470,32,46,3,'#fff');rb(221,486,32,12,0,'#2f9e44');
 g.fillStyle='#fff';g.font='bold 9px sans-serif';g.fillText('MBG',237,496);
 g.fillStyle='#222';for(const[wx,wy]of[[218,460],[252,460],[218,500],[252,500]])g.fillRect(wx,wy,3,10);
 g.strokeStyle='#ddd';g.lineWidth=1;g.strokeRect(222,471,30,14);
 /* troli ompreng + petugas MBG */
 rb(207,500,10,16,2,'#9aa3af');for(let k=0;k<3;k++)rb(208,502+k*5,8,3,1,'#ffd23f');
 g.fillStyle='#2f9e44';g.beginPath();g.ellipse(262,505,5,6,0,0,7);g.fill();g.fillStyle='#f1c27d';g.beginPath();g.arc(262,503,3.5,0,7);g.fill();g.fillStyle='#fff';g.fillRect(259,499,7,2);
 /* mobil tamu (terparkir) */
 rb(286,458,40,24,6,'rgba(0,0,0,.25)');rb(284,456,40,24,6,'#2d3a8c');rb(308,459,10,18,3,'#1b2a3a');rb(291,459,6,18,2,'#1b2a3a');rb(298,459,10,18,2,'rgba(255,255,255,.25)');
 g.fillStyle='#fff6b0';g.fillRect(322,458,2,5);g.fillRect(322,473,2,5);g.fillStyle='#9b2222';g.fillRect(284,458,2,5);g.fillRect(284,473,2,5);
 g.globalAlpha=.4;g.fillStyle='#fff';g.font='bold 18px sans-serif';g.fillText('P',304,512);g.globalAlpha=1;
 g.fillStyle='#2f6b3c';for(let x=66;x<340;x+=6)g.fillRect(x,530,3,18);g.fillRect(66,535,294,2);
 g.fillStyle='#9c4a35';g.fillRect(58,520,8,40);
 g.fillStyle='#b5523b';g.fillRect(66,524,56,9);g.fillStyle='#cfc3a5';g.fillRect(70,533,48,23);g.fillStyle='#7ec3e8';g.fillRect(76,538,16,10);
 g.fillStyle='#f1c27d';g.beginPath();g.arc(84,544,4,0,7);g.fill();g.fillStyle='#1f3a8a';g.fillRect(80,538,8,3);g.fillStyle='#6b4a2f';g.fillRect(98,540,12,16);
 g.fillStyle='#3f7a30';for(const x of[240,276,312]){g.beginPath();g.arc(x,550,8,0,7);g.fill()}
 for(const y of[150,240,335,425])tree(g,353,y,16);
 for(const x of[88,144,200,256,312])tree(g,x,289,13);
 tree(g,48,80,17);tree(g,312,80,17);
})();

/* jalur kendaraan */
const pathLen=pts=>pts.reduce((s,p,i)=>i?s+Math.hypot(p[0]-pts[i-1][0],p[1]-pts[i-1][1]):0,0);
function mkPath(v,pts,rev){v.pts=pts;v.d=0;v.rev=rev;v.a0=v.a;v.len=pathLen(pts)}
/* posisi + arah hadap + arah gerak pada jarak d di sepanjang jalur */
function pose(pts,rev,a0,d){let a=a0;for(let i=1;i<pts.length;i++){const p=pts[i-1],q=pts[i],l=Math.hypot(q[0]-p[0],q[1]-p[1]);
  if(l>.1&&!(rev&&i===1))a=Math.atan2(q[0]-p[0],-(q[1]-p[1]));
  if(d<=l||i===pts.length-1){const f=l?Math.min(1,d/l):1;return{x:p[0]+(q[0]-p[0])*f,y:p[1]+(q[1]-p[1])*f,a,mx:l?(q[0]-p[0])/l:0,my:l?(q[1]-p[1])/l:0}}d-=l}}
function along(v){const r=pose(v.pts,v.rev,v.a0,v.d);v.x=r.x;v.y=r.y;v.a=r.a}
/* tabrakan: dua kotak berputar (SAT) memakai ukuran asli kendaraan */
function ov(x1,y1,a1,t1,x2,y2,a2,t2,m){const A=SC[t1],B=SC[t2];if(Math.abs(x1-x2)>60||Math.abs(y1-y2)>60)return false;
  const c1=Math.cos(a1),s1=Math.sin(a1),c2=Math.cos(a2),s2=Math.sin(a2),h1=[A.w*A.k/2+m,A.h*A.k/2+m],h2=[B.w*B.k/2+m,B.h*B.k/2+m],
    ax=[[c1,s1],[s1,-c1],[c2,s2],[s2,-c2]],dx=x2-x1,dy=y2-y1;
  for(const[ux,uy]of ax){const r1=h1[0]*Math.abs(c1*ux+s1*uy)+h1[1]*Math.abs(s1*ux-c1*uy),r2=h2[0]*Math.abs(c2*ux+s2*uy)+h2[1]*Math.abs(s2*ux-c2*uy);
    if(Math.abs(dx*ux+dy*uy)>=r1+r2)return false}return true}
/* kendaraan berhenti jika langkah berikutnya menabrak kendaraan di depannya */
function blockedBy(v,nx,ny,na,dx,dy){for(const u of VS){if(u===v||u.state==='gone'||u.state==='park')continue;
  if(!ov(nx,ny,na,v.type,u.x,u.y,u.a,u.type,1.5)||ov(v.x,v.y,v.a,v.type,u.x,u.y,u.a,u.type,1.5))continue;
  if((u.x-v.x)*dx+(u.y-v.y)*dy>0)return true}return false}
/* jalur baru hanya boleh dimulai jika tidak berpotongan/berpapasan dengan kendaraan lain yang sedang jalan */
const STEP=5,sweep=(pts,rev,a0,d0,type)=>{const len=pathLen(pts),o=[];for(let d=d0;d<len+STEP;d+=STEP){const p=pose(pts,rev,a0,Math.min(d,len));p.type=type;o.push(p)}return o};
function canStart(v,pts,rev){const mine=sweep(pts,rev,v.a,0,v.type);
  for(const u of VS){if(u===v||(u.state!=='in'&&u.state!=='out'))continue;const th=sweep(u.pts,u.rev,u.a0,u.d,u.type);
    for(const p of mine)for(const q of th)if(ov(p.x,p.y,p.a,p.type,q.x,q.y,q.a,q.type,2)&&p.mx*q.mx+p.my*q.my<.7)return false}
  return true}
const inPts=(f,s)=>[[f.x,f.y],[LI,s.ly],[s.cx,s.ly],[s.cx,s.cy]],outPts=v=>[[v.x,v.y],[v.slot.cx,v.slot.ly],[LO,v.slot.ly],[LO,CH+40]];
function exitV(v){const s=v.slot;s.v=null;v.state='out';v.exitReq=false;mkPath(v,outPts(v),true)}
const ft=(x,y,s,c)=>FT.push({x,y,t:1.2,s,c});
const goTo=s=>{const a=P[s.t==='car'?'car':'bike'],sy=s.a?s.y+5:s.y+s.h-5;a.path=[[347,sy],[s.cx+20,sy]];a.wave=1.4}; // petugas berdiri di tepi jalur, tidak di tengah jalan kendaraan

function start(i){lvl=i;L=LV[i];
  G={time:L.t,score:0,lives:L.hp,streak:0,ok:0,spawn:1,over:false,msg:'Level '+(i+1)+': '+L.n+'. '+(i&&SLOTS.some(s=>s.lv===i)?'Area parkir diperluas: +'+SLOTS.filter(s=>s.lv===i).length+' slot baru! ':'')+'Ketuk slot kosong untuk memarkirkan kendaraan.'};
  VS=[];Q=[];FT=[];P={car:mkPet('car'),bike:mkPet('bike')};SLOTS.forEach(s=>{s.v=null;s.ok=1;s.fl=i>0&&s.lv===i?3:0});
  $('#over').hidden=true;show('game');cancelAnimationFrame(raf);last=performance.now();raf=requestAnimationFrame(loop);
}
function lose(why){G.lives--;G.msg=why;beep(120,.18);cv.classList.remove('hit');void cv.offsetWidth;cv.classList.add('hit');if(G.lives<=0)end()}
function tick(dt){
  G.time-=dt;const el=L.t-G.time;if(G.time<=0)return end();
  G.spawn-=dt;
  if(G.spawn<=0){if(Q.length<3){const t=Math.random()<.4?'bike':'car',rush=Math.random()<L.rush,p=Math.max(L.pat-3,L.pat-el/30)*(rush?.65:1);const last=Q[Q.length-1],v={type:t,c:pick(COLS[t]),x:LI,y:Math.max(CH+40,last?last.y+50:0),a:0,state:'wait',rush,p,pm:p};VS.push(v);Q.push(v);G.spawn=Math.max(L.mn,L.sp-el/50)}else G.spawn=1}
  Q.forEach((v,i)=>{if(v.y>QY[i]){const ny=Math.max(QY[i],v.y-110*dt);if(!blockedBy(v,v.x,ny,v.a,0,-1))v.y=ny}});
  const f=Q[0];
  if(f&&(f.go||f.giveUp)&&Math.abs(f.y-QY[0])<3){const pts=f.giveUp?[[f.x,f.y],[LO,f.y],[LO,CH+50]]:inPts(f,f.go);if(canStart(f,pts,false)){Q.shift();f.state=f.giveUp?'out':'in';if(!f.giveUp)f.slot=f.go;f.go=null;mkPath(f,pts,false)}}
  else if(f&&Math.abs(f.y-QY[0])<3){f.p-=dt;if(f.p<=0){f.giveUp=true;lose('Antrean terlalu lama! Kendaraan pergi.');if(G.over)return}}
  for(const v of VS){
    if(v.state==='in'||v.state==='out'){const pr=pose(v.pts,v.rev,v.a0,v.d+150*dt);
      if(blockedBy(v,pr.x,pr.y,pr.a,pr.mx,pr.my)&&(v.stuck=(v.stuck||0)+dt)<2)continue;v.stuck=0;
      v.d+=150*dt;along(v);if(v.d>=v.len){if(v.state==='out')v.state='gone';else{v.state='park';v.a=v.slot.a;v.t=rnd(L.pk[0],L.pk[1]);v.leave=false}}}
    else if(v.state==='park'){
      if(v.exitReq){if(canStart(v,outPts(v),true))exitV(v)}
      else if(!v.leave){v.t-=dt;if(v.t<=0){v.leave=true;v.p=v.pm=L.ex;beep(700,.08)}}
      else{v.p-=dt;if(v.p<=0){v.exitReq=true;lose('Kendaraan menunggu keluar terlalu lama!');if(G.over)return}}
    }
  }
  VS=VS.filter(v=>v.state!=='gone');
  for(const A of[P.car,P.bike]){const po=PET[A.k].post;
    if(A.path.length){const t=A.path[0],dx=t[0]-A.x,dy=t[1]-A.y,d=Math.hypot(dx,dy),m=150*dt;if(d<=m){A.x=t[0];A.y=t[1];A.path.shift()}else{A.x+=dx/d*m;A.y+=dy/d*m;A.a=Math.atan2(dx,-dy)}}
    else if(A.wave>0){A.wave-=dt;if(A.wave<=0&&(A.x!==po[0]||A.y!==po[1]))A.path=[[347,A.y],po]}}
  FT.forEach(f=>{f.t-=dt;f.y-=24*dt});FT=FT.filter(f=>f.t>0);SLOTS.forEach(s=>s.fl=Math.max(0,s.fl-dt*2));
}
function end(){
  G.over=true;cancelAnimationFrame(raf);
  const win=G.lives>0&&G.score>=L.tg,fin=lvl===LV.length-1,stars=!win?0:G.score>=L.tg*1.6?3:G.score>=L.tg*1.25?2:1;
  if(win)total+=G.score;
  const p=prog();p.best=Math.max(p.best,total+(win?0:G.score));if(win)p.lvl=Math.max(p.lvl,Math.min(lvl+1,LV.length-1));LS.set(KEY,p);
  $('#o-title').textContent=win?(fin?'Semua level selesai!':'Level '+(lvl+1)+' selesai!'):G.lives<=0?'Level gagal: nyawa habis':'Level gagal: target belum tercapai';
  $('#o-text').textContent=`${'★'.repeat(stars)+'☆'.repeat(3-stars)}  Skor ${G.score} (target ${L.tg}). Parkir benar: ${G.ok}. Total skor: ${total+(win?0:G.score)}.`;
  $('#o-next').hidden=!win||fin;$('#over').hidden=false;draw();
}
cv.addEventListener('pointerdown',e=>{
  if(!G||G.over)return;const r=cv.getBoundingClientRect(),px=(e.clientX-r.left)*CW/r.width,py=(e.clientY-r.top)*CH/r.height;
  const s=SLOTS.find(s=>px>=s.x&&px<=s.x+s.w&&py>=s.y&&py<=s.y+s.h);if(!s)return;
  if(s.lv>lvl){G.msg='Lahan ini baru dibuka di level '+(s.lv+1)+'.';return}
  if(s.v){if(s.v.exitReq){G.msg='Kendaraan sedang menunggu jalur kosong untuk keluar.';return}
    if(s.v.leave&&s.v.state==='park'){s.v.exitReq=true;G.score+=50;G.msg='Petugas membantu kendaraan keluar. +50';ft(s.cx,s.cy,'+50','#ffc933');goTo(s);beep(520,.08)}else G.msg='Slot sudah terisi.';return}
  const f=Q[0];if(!f||Math.abs(f.y-QY[0])>=4){G.msg='Tunggu kendaraan sampai di gerbang.';return}
  if(f.go||f.giveUp){G.msg='Kendaraan sedang menunggu jalur kosong.';return}
  s.fl=1;
  if(s.t!==f.type){s.ok=0;G.streak=0;G.score=Math.max(0,G.score-50);ft(s.cx,s.cy,'-50','#ff5d5d');lose(`Salah area! ${SC[f.type].t} harus di area ${SC[s.t].t}.`);return}
  s.ok=1;f.go=s;s.v=f; // kendaraan jalan begitu jalurnya kosong (tidak menabrak kendaraan lain)
  const pt=f.rush?200:100;G.ok++;G.streak++;G.score+=pt;G.msg='Parkir benar! +'+pt+(f.rush?' (buru-buru)':'');ft(s.cx,s.cy,'+'+pt,f.rush?'#ff9f1a':'#38d27a');
  if(G.streak%5===0){G.score+=50;G.msg+=' · Kombo +50';ft(s.cx,s.cy-16,'KOMBO +50','#ffc933')}
  goTo(s);beep(660,.08);
});

function rr(x,y,w,h,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,r):ctx.rect(x,y,w,h);ctx.fill()}
function drawVeh(v,c){const x=ctx,hw=v.w/2,hh=v.h/2;
  x.shadowColor='rgba(0,0,0,.4)';x.shadowBlur=6;x.shadowOffsetY=3;
  if(v.t==='motor'){rr(-3,-hh,6,v.h,3,c);x.shadowColor='transparent';rr(-hw,-hh+5,v.w,3,1.5,'#222');rr(-5,2,10,10,4,'#fff');rr(-4,-5,8,8,4,'#2d7ff9');x.fillStyle='#9b2222';x.fillRect(-2,hh-2,4,2)}
  else{rr(-hw,-hh,v.w,v.h,6,c);x.shadowColor='transparent';
    rr(-hw+3,-hh+8,v.w-6,9,3,'#1b2a3a');rr(-hw+3,hh-12,v.w-6,7,3,'#1b2a3a');rr(-hw+4,-hh+18,v.w-8,v.h-32,3,'rgba(255,255,255,.25)');
    x.fillStyle='#111';x.fillRect(-hw-2,-hh+5,2,8);x.fillRect(hw,-hh+5,2,8);
    x.fillStyle='#fff6b0';x.fillRect(-hw+2,-hh,5,3);x.fillRect(hw-7,-hh,5,3);x.fillStyle='#9b2222';x.fillRect(-hw+2,hh-3,5,3);x.fillRect(hw-7,hh-3,5,3)}
  x.shadowColor='transparent'}
function bar(x,y,w,p,m){ctx.fillStyle='#0008';ctx.fillRect(x,y,w,4);ctx.fillStyle=p<4?'#ff5d5d':'#38d27a';ctx.fillRect(x,y,w*Math.max(0,p/m),4)}
function label(x,y,w,t,c){rr(x,y,w,16,6,c);ctx.fillStyle='#1b1e23';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillText(t,x+w/2,y+11)}
function drawPet(A){const x=ctx,col=PET[A.k].col,moving=A.path.length>0,b=moving?Math.sin(tt*14):0;
  x.save();x.translate(A.x,A.y);x.rotate(A.a);
  x.fillStyle='rgba(0,0,0,.3)';x.beginPath();x.ellipse(2,3,10,7,0,0,7);x.fill();
  x.fillStyle='#222';x.fillRect(-5,-6+b*3,4,6);x.fillRect(1,-6-b*3,4,6);
  x.fillStyle=col;x.beginPath();x.ellipse(0,0,9,5.5,0,0,7);x.fill();x.fillStyle='#fff6b0';x.fillRect(-9,-1,18,2);
  x.strokeStyle=col;x.lineWidth=3;x.lineCap='round';x.beginPath();x.moveTo(-8,0);x.lineTo(-10,-6+b*2);x.stroke();
  x.beginPath();x.moveTo(8,0);x.lineTo(11,A.wave>0?-10:-6-b*2);x.stroke();
  if(A.wave>0){const sw=Math.sin(tt*14)*.6;x.strokeStyle='#fff';x.lineWidth=2;x.beginPath();x.moveTo(11,-10);x.lineTo(11+Math.sin(sw)*14,-10-Math.cos(sw)*14);x.stroke()}
  x.fillStyle='#f1c27d';x.beginPath();x.arc(0,0,4.5,0,7);x.fill();x.fillStyle='#1f3a8a';x.beginPath();x.arc(0,-.5,4.8,0,7);x.fill();x.fillRect(-3,-8,6,3);
  x.restore();x.fillStyle='#fff';x.font='bold 8px sans-serif';x.textAlign='center';x.strokeStyle='#000a';x.lineWidth=3;x.strokeText(PET[A.k].name,Math.min(A.x,318),A.y-14);x.fillText(PET[A.k].name,Math.min(A.x,318),A.y-14)}
function draw(){
  const x=ctx;x.drawImage(BG,0,0);
  SLOTS.forEach(s=>{if(s.lv>lvl){x.fillStyle='#7a6648';x.fillRect(s.x+1,s.y+1,s.w-2,s.h-2);x.strokeStyle='#ffc933';x.lineWidth=3;x.setLineDash([6,6]);x.strokeRect(s.x+3,s.y+3,s.w-6,s.h-6);x.setLineDash([]);x.save();x.beginPath();x.rect(s.cx-14,s.cy-12,28,8);x.clip();x.fillStyle='#ffc933';x.fillRect(s.cx-14,s.cy-12,28,8);x.strokeStyle='#222';x.lineWidth=3;for(let k=0;k<5;k++){x.beginPath();x.moveTo(s.cx-18+k*8,s.cy-4);x.lineTo(s.cx-10+k*8,s.cy-12);x.stroke()}x.restore();x.font='bold 8px sans-serif';x.textAlign='center';x.fillStyle='#fff';x.fillText('Lv '+(s.lv+1),s.cx,s.cy+10)}});
  SLOTS.forEach(s=>{if(s.fl>0){x.fillStyle=(s.ok?'rgba(56,210,122,':'rgba(255,93,93,')+s.fl*.55+')';x.fillRect(s.x,s.y,s.w,s.h)}});
  VS.slice().sort((a,b)=>a.y-b.y).forEach(v=>{const d=SC[v.type];x.save();x.translate(v.x,v.y);x.rotate(v.a);x.scale(d.k,d.k);drawVeh(d,v.c);x.restore()});
  const f=Q[0];
  if(f&&Math.abs(f.y-QY[0])<4){const bw=f.rush?124:72,bx=70;rr(bx,f.y-18,bw,34,4,f.rush?'#ffb454':'#e9eaf6');x.fillStyle='#04141c';x.font='bold 11px sans-serif';x.textAlign='left';x.fillText((f.rush?'BURU-BURU · ':'')+(f.type==='car'?'MOBIL':'MOTOR'),bx+7,f.y-4);bar(bx+7,f.y+4,bw-14,f.p,f.pm)}
  VS.forEach(v=>{if(v.state==='park'&&v.leave&&!v.exitReq&&Math.sin(tt*8)>-.3){label(v.x-22,v.y-34,44,'KELUAR','#ffc933');bar(v.x-20,v.y-17,40,v.p,v.pm)}});
  drawPet(P.car);drawPet(P.bike);
  FT.forEach(f=>{x.globalAlpha=Math.min(1,f.t*2);x.fillStyle=f.c;x.strokeStyle='#000a';x.lineWidth=3;x.font='bold 14px sans-serif';x.textAlign='center';x.strokeText(f.s,f.x,f.y);x.fillText(f.s,f.x,f.y);x.globalAlpha=1});
  $('#h-lv').textContent=(lvl+1)+'/'+LV.length;$('#h-time').textContent=Math.max(0,Math.ceil(G.time))+' dtk';
  $('#h-hit').textContent=G.lives;$('#h-score').textContent=G.score+'/'+L.tg;$('#hint').textContent=G.msg+(G.streak>1?'  ·  Beruntun x'+G.streak:'');
}
function loop(ts){const dt=Math.min(.05,(ts-last)/1000);last=ts;tt+=dt;if(!G.over)tick(dt);draw();if(!G.over)raf=requestAnimationFrame(loop)}
$('#b-start').onclick=()=>{total=0;start(Math.min(prog().lvl||0,LV.length-1))};
$('#o-again').onclick=()=>start(lvl);$('#o-next').onclick=()=>start(lvl+1);
$('#b-quit').onclick=()=>{if(G&&!G.over)end()};
$('#o-menu').onclick=()=>{$('#over').hidden=true;cancelAnimationFrame(raf);menu()};
menu();
