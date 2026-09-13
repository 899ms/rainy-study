import * as THREE from 'three';
import {createImmersive} from './immersive.js';
import {createChildren} from './children.js';
let children=null;
let immersive=null;
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ============================================================
   雨夜书房 / AFTER HOURS
   ============================================================ */
const $ = s => document.querySelector(s);
const lerp = (a,b,t)=>a+(b-a)*t;
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------- 状态 ---------- */
const S = {
  weather:'rain', view:'pano', selectedBook:null, noteText:'', ready:false,
  noteOpen:false, readerOpen:false, typing:false
};
const NOTE_KEY = 'afterhours.note.v1';

/* ---------- 场景 ---------- */
const app = $('#app');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e1714);
scene.fog = new THREE.FogExp2(0x101a16, 0.022);

const camera = new THREE.PerspectiveCamera(48, innerWidth/innerHeight, 0.1, 120);
camera.position.set(-5.6, 3.9, 7.3);

const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 2.4;
controls.maxDistance = 14;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minPolarAngle = Math.PI * 0.16;
controls.target.set(1.1, 2.25, -1.7);

/* 初始视角（与“回到初始视角”完全一致） */
const HOME = {
  pos:new THREE.Vector3(-5.6, 3.9, 7.3),
  tgt:new THREE.Vector3(1.1, 2.25, -1.7)
};

/* ============================================================
   程序化纹理
   ============================================================ */
function mk(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
function cv(c){ const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t; }
function hex(c){ return '#' + c.toString(16).padStart(6,'0'); }

/* 木纹 */
function woodTex(base, dark, gx=768, gy=768, warm=true){
  const c = mk(gx,gy), x = c.getContext('2d');
  x.fillStyle = hex(base); x.fillRect(0,0,gx,gy);
  // 长条纹
  for(let i=0;i<gy;i+=2){
    const n = Math.sin(i*0.055)*0.5 + Math.sin(i*0.013+1.7)*0.5;
    x.globalAlpha = 0.05 + 0.07*Math.abs(n);
    x.fillStyle = hex(dark);
    x.fillRect(0, i, gx, 1 + ((i*7)%3));
  }
  x.globalAlpha = 1;
  // 节疤与年轮
  for(let k=0;k<gx/70;k++){
    const px = (k*137.7+41)%gx, py = (k*61.3+23)%gy, R = 5+((k*13)%22);
    for(let r=R;r>0;r-=2){
      x.globalAlpha = 0.10 + (R-r)*0.012;
      x.fillStyle = hex(dark);
      x.beginPath(); x.ellipse(px,py,r*1.5,r*0.55,0,0,Math.PI*2); x.fill();
    }
  }
  x.globalAlpha = 1;
  // 横向木板缝
  for(let i=0;i<6;i++){
    const y = gy*(0.12 + i*0.155) + ((i*29)%9);
    x.globalAlpha = 0.16; x.fillStyle = hex(dark);
    x.fillRect(0, y, gx, 2); x.globalAlpha = 1;
  }
  // 微粒噪点
  const d = x.getImageData(0,0,gx,gy), p = d.data;
  for(let i=0;i<p.length;i+=4){
    const n = (Math.random()-0.5) * (warm?16:11);
    p[i]+=n; p[i+1]+=n*0.9; p[i+2]+=n*0.8;
  }
  x.putImageData(d,0,0);
  return cv(c);
}

/* 墙面：奶油白微颗粒 */
function wallTex(){
  const c=mk(512,512), x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,512);
  g.addColorStop(0,'#F6EFE1'); g.addColorStop(1,'#E3D8C3');
  x.fillStyle=g; x.fillRect(0,0,512,512);
  const d=x.getImageData(0,0,512,512), p=d.data;
  for(let i=0;i<p.length;i+=4){ const n=(Math.random()-0.5)*13; p[i]+=n;p[i+1]+=n;p[i+2]+=n; }
  x.putImageData(d,0,0);
  return cv(c);
}

/* 地毯：深墨绿花纹 */
function rugTex(){
  const c=mk(512,512), x=c.getContext('2d');
  x.fillStyle='#243A30'; x.fillRect(0,0,512,512);
  const d=x.getImageData(0,0,512,512), p=d.data;
  for(let i=0;i<p.length;i+=4){ const n=(Math.random()-0.5)*20; p[i]+=n*0.7;p[i+1]+=n;p[i+2]+=n*0.8; }
  x.putImageData(d,0,0);
  x.globalAlpha=0.5;
  for(let i=0;i<9;i++){
    x.strokeStyle = i%2 ? '#2E4C40' : '#1B2E26';
    x.lineWidth = 1.4 + (i%3);
    x.strokeRect(22+i*26, 22+i*26, 512-44-i*52, 512-44-i*52);
  }
  x.globalAlpha=0.22; x.fillStyle='#D8A24A';
  for(let i=0;i<40;i++){
    const px=40+((i*97)%432), py=40+((i*53)%432);
    x.beginPath(); x.arc(px,py,2.2,0,Math.PI*2); x.fill();
  }
  x.globalAlpha=1;
  return cv(c);
}

/* 书脊纹理（竖排中文感） */
function bookSpineTex(col, title, dark){
  const w=128, h=512, c=mk(w,h), x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,w,0);
  g.addColorStop(0, hex(col)); g.addColorStop(0.5, hex(shade(col,26))); g.addColorStop(1, hex(shade(col,-22)));
  x.fillStyle=g; x.fillRect(0,0,w,h);
  // 顶/底色带
  x.fillStyle=hex(dark); x.fillRect(0,0,w,26); x.fillRect(0,h-26,w,22);
  x.globalAlpha=0.35; x.fillStyle=hex(shade(col,52));
  x.fillRect(0,26,w,5); x.fillRect(0,h-31,w,4);
  // 竖排标题
  x.globalAlpha=0.95;
  const chars = title.split('');
  const fs = 30, per = 40, total = chars.length*per;
  const sy = (h - total)/2;
  x.textAlign='center'; x.textBaseline='middle';
  x.font = `600 ${fs}px "Songti SC","STSong","Noto Serif SC",serif`;
  chars.forEach((ch,i)=>{
    x.fillStyle = 'rgba(0,0,0,0.30)'; x.fillText(ch, w/2+1.5, sy+i*per+1.5);
    x.fillStyle = isLight(col) ? 'rgba(30,26,18,0.92)' : 'rgba(246,239,225,0.94)';
    x.fillText(ch, w/2, sy+i*per);
  });
  // 底部小标
  x.globalAlpha=0.6; x.font='13px Georgia,serif';
  x.fillStyle = isLight(col) ? 'rgba(30,26,18,0.7)' : 'rgba(246,239,225,0.7)';
  x.fillText('A.H.', w/2, h-56);
  x.globalAlpha=1;
  // 细噪点
  const d=x.getImageData(0,0,w,h), p=d.data;
  for(let i=0;i<p.length;i+=4){ const n=(Math.random()-0.5)*10; p[i]+=n;p[i+1]+=n;p[i+2]+=n; }
  x.putImageData(d,0,0);
  return cv(c);
}
function shade(col,amt){
  let r=(col>>16)&255, g=(col>>8)&255, b=col&255;
  r=clamp(r+amt,0,255);g=clamp(g+amt,0,255);b=clamp(b+amt,0,255);
  return (r<<16)|(g<<8)|b;
}
function isLight(col){ return ((col>>16)&255)*0.3+((col>>8)&255)*0.59+(col&255)*0.11 > 132; }

/* 便签纸 */
function noteTex(text){
  const w=320,h=240,c=mk(w,h),x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,w,h);
  g.addColorStop(0,'#F6E7B8'); g.addColorStop(1,'#E5C887');
  x.fillStyle=g; x.fillRect(0,0,w,h);
  x.globalAlpha=0.5; x.fillStyle='#C9A45A';
  for(let i=0;i<5;i++) x.fillRect(0, 34+i*42, w, 1);
  x.globalAlpha=0.9;
  x.fillStyle='rgba(60,44,16,0.9)';
  x.font='19px "Songti SC","STSong",serif';
  x.textAlign='left'; x.textBaseline='top';
  wrap(x, text||'夜里想到的事，写在这里……', 22, 26, w-40, 26, 8);
  x.globalAlpha=1;
  // 折角
  x.fillStyle='rgba(150,115,50,0.35)';
  x.beginPath(); x.moveTo(w-34,0); x.lineTo(w,0); x.lineTo(w,30); x.closePath(); x.fill();
  return cv(c);
}
function wrap(ctx,text,px,py,maxw,lh,maxlines){
  let line='', yy=py, n=0;
  const draw=()=>{ if(line) ctx.fillText(line,px,yy); };
  for(const ch of text){
    if(ch==='\n'){ draw(); line=''; yy+=lh; n++; if(n>=maxlines) return; continue; }
    if(ctx.measureText(line+ch).width>maxw){ draw(); line=ch; yy+=lh; n++; if(n>=maxlines) return; }
    else line+=ch;
  }
  draw();
}

/* 窗外景：雨夜 / 晴日 */
function skyTex(mode){
  const w=768,h=768,c=mk(w,h),x=c.getContext('2d');
  if(mode==='rain'){
    const g=x.createLinearGradient(0,0,0,h);
    g.addColorStop(0,'#0B1626'); g.addColorStop(0.45,'#13243A'); g.addColorStop(0.72,'#1E3148');
    g.addColorStop(0.86,'#2A3D4F'); g.addColorStop(1,'#33454F');
    x.fillStyle=g; x.fillRect(0,0,w,h);
    // 远楼
    for(let i=0;i<11;i++){
      const bw=40+((i*37)%70), bx=i*(w/11), bh=90+((i*53)%210);
      x.fillStyle = `rgba(${9+((i*7)%16)},${15+((i*11)%20)},${26+((i*13)%24)},0.92)`;
      x.fillRect(bx, h*0.62-bh, bw, bh);
      // 窗灯
      for(let k=0;k<7;k++){
        if(((i*31+k*17)%5)<2){
          x.fillStyle=`rgba(216,162,74,${0.22+((k*23)%30)/100})`;
          x.fillRect(bx+6+((k*11)%(bw-12)), h*0.62-bh+10+((k*29)%(bh-22)), 5, 7);
        }
      }
    }
    // 水雾
    const f=x.createLinearGradient(0,h*0.5,0,h);
    f.addColorStop(0,'rgba(60,80,95,0)'); f.addColorStop(1,'rgba(70,88,100,0.4)');
    x.fillStyle=f; x.fillRect(0,h*0.5,w,h*0.5);
  } else {
    const g=x.createLinearGradient(0,0,0,h);
    g.addColorStop(0,'#8FC3E8'); g.addColorStop(0.42,'#B9D9EE'); g.addColorStop(0.7,'#E4E9DE');
    g.addColorStop(1,'#C9B48C');
    x.fillStyle=g; x.fillRect(0,0,w,h);
    // 太阳
    x.fillStyle='rgba(255,236,190,0.95)';
    x.beginPath(); x.arc(w*0.68,h*0.32,58,0,Math.PI*2); x.fill();
    x.fillStyle='rgba(255,220,150,0.35)';
    x.beginPath(); x.arc(w*0.68,h*0.32,88,0,Math.PI*2); x.fill();
    // 云
    x.fillStyle='rgba(255,255,255,0.72)';
    for(let i=0;i<7;i++){
      const cx=((i*137)%w), cy=h*0.16+((i*41)%90), cw=70+((i*53)%130);
      x.beginPath(); x.ellipse(cx,cy,cw,cw*0.22,0,0,Math.PI*2); x.fill();
    }
    // 远山
    x.fillStyle='rgba(96,116,128,0.55)';
    x.beginPath(); x.moveTo(0,h*0.66);
    for(let i=0;i<=10;i++) x.lineTo(i*(w/10), h*0.66 - 40 - ((i*67)%85));
    x.lineTo(w,h); x.lineTo(0,h); x.fill();
    x.fillStyle='rgba(70,92,86,0.7)';
    x.beginPath(); x.moveTo(0,h*0.78);
    for(let i=0;i<=8;i++) x.lineTo(i*(w/8), h*0.78 - 18 - ((i*41)%45));
    x.lineTo(w,h); x.lineTo(0,h); x.fill();
  }
  return cv(c);
}

/* 台灯灯罩 */
function shadeTex(){
  const w=256,h=256,c=mk(w,h),x=c.getContext('2d');
  const g=x.createRadialGradient(w/2,h/2,10,w/2,h/2,w/2);
  g.addColorStop(0,'#F7D89A'); g.addColorStop(0.6,'#D9A75E'); g.addColorStop(1,'#8A5F2E');
  x.fillStyle=g; x.fillRect(0,0,w,h);
  const d=x.getImageData(0,0,w,h), p=d.data;
  for(let i=0;i<p.length;i+=4){ const n=(Math.random()-0.5)*14; p[i]+=n;p[i+1]+=n;p[i+2]+=n; }
  x.putImageData(d,0,0);
  return cv(c);
}

/* ============================================================
   房间结构
   ============================================================ */
const ROOM = { W:17, D:14, H:7.2, wallY:0 };
const meshes = [];
function add(m, cast=true, recv=false){
  m.castShadow = cast; m.receiveShadow = recv;
  scene.add(m); meshes.push(m); return m;
}

// 地板
const floorMat = new THREE.MeshStandardMaterial({
  map: woodTex(0x5a3d26, 0x3a2616, 1024, 1024), roughness:0.78, metalness:0.05 });
floorMat.map.wrapS = floorMat.map.wrapT = THREE.RepeatWrapping;
floorMat.map.repeat.set(3.4, 2.8);
const floor = add(new THREE.Mesh(new THREE.BoxGeometry(ROOM.W,0.5,ROOM.D), floorMat), false, true);
floor.position.set(0,-0.25,0);

// 窗户（右墙，开口朝YZ平面）
const WIN = { w:5.4, h:3.5, cx:ROOM.W/2-0.2, cy:3.4, cz:-1.2 };

// 后墙、左墙、右墙（带窗）
const wallMat = new THREE.MeshStandardMaterial({ map: wallTex(), roughness:0.92, metalness:0.02 });
const back = add(new THREE.Mesh(new THREE.BoxGeometry(ROOM.W, ROOM.H, 0.4), wallMat), false, true);
back.position.set(0, ROOM.H/2, -ROOM.D/2);
const left = add(new THREE.Mesh(new THREE.BoxGeometry(0.4, ROOM.H, ROOM.D), wallMat), false, true);
left.position.set(-ROOM.W/2, ROOM.H/2, 0);
const WT = 0.4; // 右墙厚度
const WINZ0 = WIN.cz - WIN.w/2, WINZ1 = WIN.cz + WIN.w/2;
const WINY0 = WIN.cy - WIN.h/2, WINY1 = WIN.cy + WIN.h/2;
function wallSeg(centerZ, zSize, y0, ySize){
  const m = add(new THREE.Mesh(new THREE.BoxGeometry(WT, ySize, zSize), wallMat), false, true);
  m.position.set(ROOM.W/2, y0 + ySize/2, centerZ);
  return m;
}
const right = new THREE.Group();
wallSeg((WINZ1 + ROOM.D/2)/2,        ROOM.D/2 - WINZ1, 0,     ROOM.H);          // 窗前段
wallSeg((WINZ0 - ROOM.D/2)/2,        WINZ0 + ROOM.D/2, 0,     ROOM.H);          // 窗后段
wallSeg(WIN.cz, WIN.w,               0,     WINY0);                              // 窗下墙
wallSeg(WIN.cz, WIN.w,               WINY1, ROOM.H - WINY1);                     // 窗上墙
scene.add(right);

// 天花
const ceil = add(new THREE.Mesh(new THREE.BoxGeometry(ROOM.W, 0.35, ROOM.D),
  new THREE.MeshStandardMaterial({ color:0x2c2620, roughness:0.95 })), false, true);
ceil.position.set(0, ROOM.H-0.175, 0);

// 踢脚线
const skirtMat = new THREE.MeshStandardMaterial({ color:0x2b2118, roughness:0.7 });
const s1 = add(new THREE.Mesh(new THREE.BoxGeometry(ROOM.W-0.6,0.42,0.16), skirtMat), false, false);
s1.position.set(0,0.21,-ROOM.D/2+0.28);
const s2 = add(new THREE.Mesh(new THREE.BoxGeometry(0.16,0.42,ROOM.D-0.6), skirtMat), false, false);
s2.position.set(-ROOM.W/2+0.28,0.21,0);
const s3a = add(new THREE.Mesh(new THREE.BoxGeometry(0.16,0.42,ROOM.D-0.6), skirtMat), false, false);
s3a.position.set(ROOM.W/2-0.28,0.21,0);


const frameMat = new THREE.MeshStandardMaterial({ color:0x2a2018, roughness:0.55, metalness:0.15 });
// 天空板（凹进墙内，窗框之后，真实可见且不穿墙）
// 天空板置于室外（右墙外侧），沿Y轴旋转使法线朝向室内（-X）
// 观察顺序：玻璃 -> 雨 -> 天空（天空位于所有雨点之后）
// 雨区x1=右墙+3.4，天空板放在x=右墙+5.0确保比所有雨点更远
const SKY_GAP = 5.0;
const sky = new THREE.Mesh(new THREE.PlaneGeometry(WIN.w*3.2, WIN.h*3.2),
  new THREE.MeshBasicMaterial({ map: skyTex('rain'), side: THREE.FrontSide }));
sky.rotation.y = -Math.PI/2;
sky.position.set(ROOM.W/2 + SKY_GAP, WIN.cy, WIN.cz);
scene.add(sky); meshes.push(sky);
// 玻璃（与天空板同朝向）
const glass = new THREE.Mesh(new THREE.PlaneGeometry(WIN.w-0.15, WIN.h-0.15),
  new THREE.MeshPhysicalMaterial({ color:0xb9c8cf, roughness:0.06, metalness:0,
    transparent:true, opacity:0.13, side:THREE.DoubleSide }));
glass.rotation.y = -Math.PI/2;
glass.position.set(WIN.cx-0.28, WIN.cy, WIN.cz);
glass.renderOrder = 2; scene.add(glass); meshes.push(glass);
// 窗框
function fbox(w,h,d,px,py,pz){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), frameMat);
  m.position.set(px,py,pz); return add(m, true, false); }
fbox(0.42, 0.3, WIN.w+0.24, WIN.cx-0.1, WIN.cy+WIN.h/2+0.13, WIN.cz);
fbox(0.42, 0.3, WIN.w+0.24, WIN.cx-0.1, WIN.cy-WIN.h/2-0.13, WIN.cz);
fbox(0.42, WIN.h+0.24, 0.3, WIN.cx-0.1, WIN.cy, WIN.cz-WIN.w/2-0.13);
fbox(0.42, WIN.h+0.24, 0.3, WIN.cx-0.1, WIN.cy, WIN.cz+WIN.w/2+0.13);
// 竖棂
for(let i=-1;i<=1;i++) fbox(0.2, WIN.h-0.1, 0.16, WIN.cx-0.12, WIN.cy, WIN.cz+i*WIN.w/3);
// 横棂
fbox(0.2, 0.16, WIN.w-0.1, WIN.cx-0.12, WIN.cy, WIN.cz);
// 窗台
const sill = add(new THREE.Mesh(new THREE.BoxGeometry(0.72,0.2,WIN.w+0.7),
  new THREE.MeshStandardMaterial({ map: woodTex(0x6b4a2c,0x3f2b18,512,256), roughness:0.6 })), true, false);
sill.position.set(WIN.cx-0.16, WIN.cy-WIN.h/2-0.32, WIN.cz);

/* ============================================================
   书架
   ============================================================ */
const SHELF = { x:-3.6, y:0, z:-ROOM.D/2+0.45, w:8.5, h:6.6, d:0.92 };
const shelfWood = new THREE.MeshStandardMaterial({ map: woodTex(0x553922,0x35220f,768,512), roughness:0.72 });
const shelfBack = new THREE.MeshStandardMaterial({ color:0x241910, roughness:0.9 });

// 背板
const sb = add(new THREE.Mesh(new THREE.BoxGeometry(SHELF.w, SHELF.h, 0.1), shelfBack), false, false);
sb.position.set(SHELF.x, SHELF.y+SHELF.h/2, SHELF.z-SHELF.d/2+0.06);
// 侧板
[ -1, 1 ].forEach(s=>{
  const m = add(new THREE.Mesh(new THREE.BoxGeometry(0.22, SHELF.h, SHELF.d), shelfWood), true, false);
  m.position.set(SHELF.x+s*SHELF.w/2, SHELF.y+SHELF.h/2, SHELF.z);
});
// 层板
const shelfYs = [];
const nLayers = 5;
for(let i=0;i<=nLayers;i++){
  const yy = 0.42 + i*(SHELF.h-0.7)/nLayers;
  shelfYs.push(yy);
  const m = add(new THREE.Mesh(new THREE.BoxGeometry(SHELF.w-0.3, 0.14, SHELF.d), shelfWood), true, false);
  m.position.set(SHELF.x, yy+0.07, SHELF.z);
}

/* ---------- 普通装饰书 + 三本可读书 ---------- */
const BOOKS = [
  { title:'造物的方法',       col:0x2E4A3C, dark:0x16291F, meta:'深夜书房 · 随笔 No.01',
    body:'造物的方法，不在图纸上，而在反复推翻图纸的夜里。先把问题摸到发烫，再让手替脑子做决定；材料会告诉你它能成为什么，而你不能强迫它。最差的方案往往是最想炫技的那一个，最好的方案通常朴素得让人想忽略。留一点余量，给时间，也给偶然。' },
  { title:'未完成的想法',     col:0x8A5A2B, dark:0x4A2F13, meta:'深夜书房 · 随笔 No.02',
    body:'有些想法不该被写完。它们像半掩的门，留着光，也留着退路。完整的答案容易被供奉，也容易被遗忘；未完成的却始终在生长，每次想起都长出新的枝。别急着收尾，把问题放在口袋里焐热，某天它会自己打开。留白不是偷懒，是信任。' },
  { title:'把世界做成接口', col:0x6B3A3A, dark:0x3A1D1D, meta:'深夜书房 · 随笔 No.03',
    body:'世界已经是接口了，只是文档写得不好。万物彼此调用：雨水调用屋檐，灯火调用夜晚，你调用一段记忆，又被一段记忆改写参数。设计者的任务不是新增功能，而是降低调用的成本，让下一个赶来的人不必从头读起。最好的接口，让人忘记它的存在。' }
];
const bookMeshes = [];

function placeShelfBooks(){
  // 每层填书，第 2 层（i=1）留出三本可读书的显眼位置
  const palette = [0x3b5a4a,0x6e4a2a,0x5c3a3a,0x41443f,0x7a5a34,0x38505c,0x5e4b32,0x4a3f55];
  const shelfZ = SHELF.z + 0.16;
  for(let layer=0; layer<nLayers; layer++){
    const yBase = shelfYs[layer] + 0.07;
    let x = SHELF.x - SHELF.w/2 + 0.42;
    const xEnd = SHELF.x + SHELF.w/2 - 0.42;
    const isFocusLayer = layer === 2;
    let idx = 0;
    while(x < xEnd - 0.28){
      const hgt = 1.05 + ((layer*53 + idx*29)%5)*0.13;
      const wid = 0.30 + ((idx*17)%4)*0.055;
      const col = palette[(layer*5+idx)%palette.length];
      const tex = bookSpineTex(shade(col, ((idx*23)%40)-20), '卷'+(idx+layer*3), shade(col,-26));
      const mat = new THREE.MeshStandardMaterial({ map:tex, roughness:0.88, metalness:0.0, emissive:0x000000 });
      const m = new THREE.Mesh(new THREE.BoxGeometry(wid, hgt, 0.56), mat);
      m.position.set(x + wid/2, yBase + hgt/2, shelfZ);
      m.rotation.z = (((idx*37)%7)-3) * 0.012;
      add(m, true, false);
      x += wid + 0.045 + ((idx*13)%3)*0.02;
      idx++;
      if(isFocusLayer && idx === 5){
        // 留出三本可读书的连续空间
        BOOKS.forEach((b,i)=>{
          const wid2 = 0.5;
          const tex2 = bookSpineTex(b.col, b.title, b.dark);
          const mat2 = new THREE.MeshStandardMaterial({ map:tex2, roughness:0.82, metalness:0.0, emissive:0x000000 });
          const m2 = new THREE.Mesh(new THREE.BoxGeometry(wid2, 1.6, 0.62), mat2);
          m2.position.set(x + wid2/2 + 0.02, yBase + 0.82, shelfZ + 0.03);
          m2.userData = { book:i, hoverable:true };
          add(m2, true, false);
          bookMeshes.push(m2);
          x += wid2 + 0.075;
        });
      }
    }
  }
  // 小摆件：陶罐（LatheGeometry 车出罐体，避免 CylinderGeometry 参数错误）
  const vasePts = [
    new THREE.Vector2(0.05, 0.0), new THREE.Vector2(0.15, 0.02), new THREE.Vector2(0.19, 0.06),
    new THREE.Vector2(0.17, 0.12), new THREE.Vector2(0.13, 0.2), new THREE.Vector2(0.11, 0.3),
    new THREE.Vector2(0.13, 0.38), new THREE.Vector2(0.06, 0.43), new THREE.Vector2(0.05, 0.45)
  ];
  const vase = add(new THREE.Mesh(new THREE.LatheGeometry(vasePts, 28),
    new THREE.MeshStandardMaterial({ color:0x3f5a4b, roughness:0.55 })), true, false);
  vase.position.set(SHELF.x+SHELF.w/2-0.55, shelfYs[3]+0.07, SHELF.z+0.2);
  const clock = add(new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.1),
    new THREE.MeshStandardMaterial({ color:0x2b2118, roughness:0.6 })), true, false);
  clock.position.set(SHELF.x-SHELF.w/2+0.6, shelfYs[1]+0.4, SHELF.z+0.28);
  // 相框
  const frame = add(new THREE.Mesh(new THREE.BoxGeometry(0.62,0.78,0.06),
    new THREE.MeshStandardMaterial({ color:0x8a6a3a, roughness:0.5 })), true, false);
  frame.position.set(SHELF.x+1.2, shelfYs[4]+0.45, SHELF.z+0.22);
}
placeShelfBooks();

/* ============================================================
   书桌
   ============================================================ */
const DESK = { x:1.6, y:0, z:1.1, w:4.4, h:0.8, d:2.3, top:0 };
DESK.top = DESK.h;
const deskWood = new THREE.MeshStandardMaterial({ map: woodTex(0x6a4626,0x3d2814,1024,512), roughness:0.6, metalness:0.06 });
// 桌面
const dtop = add(new THREE.Mesh(new THREE.BoxGeometry(DESK.w, 0.16, DESK.d), deskWood), true, true);
dtop.position.set(DESK.x, DESK.top-0.08, DESK.z);
// 桌腿
[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{
  const m = add(new THREE.Mesh(new THREE.BoxGeometry(0.2, DESK.h-0.16, 0.2),
    new THREE.MeshStandardMaterial({ map: woodTex(0x523718,0x2f1e0e,256,256), roughness:0.75 })), true, false);
  m.position.set(DESK.x+sx*(DESK.w/2-0.22), (DESK.h-0.16)/2, DESK.z+sz*(DESK.d/2-0.22));
});
// 抽屉
const drw = add(new THREE.Mesh(new THREE.BoxGeometry(DESK.w-0.5, 0.42, 0.18),
  new THREE.MeshStandardMaterial({ map: woodTex(0x58391d,0x31200f,512,256), roughness:0.7 })), true, false);
drw.position.set(DESK.x, DESK.top-0.36, DESK.z-DESK.d/2+0.18);
const knob = add(new THREE.Mesh(new THREE.SphereGeometry(0.045,12,12),
  new THREE.MeshStandardMaterial({ color:0xc9a24a, roughness:0.35, metalness:0.6 })), true, false);
knob.position.set(DESK.x+0.9, DESK.top-0.36, DESK.z-DESK.d/2+0.3);

/* ---------- 台灯 ---------- */
function DEK_Z(d){ return d.z; }
const LAMP = { x:DESK.x+DESK.w/2-0.75, y:DESK.top, z:DEK_Z(DESK)-0.55 };
function makeLamp(){
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.26,0.1,24),
    new THREE.MeshStandardMaterial({ color:0x3a2c1e, roughness:0.5, metalness:0.3 }));
  base.position.y = 0.05; base.castShadow = true; g.add(base);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.028,1.05,16),
    new THREE.MeshStandardMaterial({ color:0xb08d4a, roughness:0.35, metalness:0.7 }));
  rod.position.y = 0.1+0.525; rod.castShadow = true; g.add(rod);
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.34,0.42,28,1,true),
    new THREE.MeshStandardMaterial({ map: shadeTex(), roughness:0.45,
      emissive:0xf0c078, emissiveIntensity:0.55, side:THREE.DoubleSide }));
  sh.position.y = 1.36; sh.castShadow = true; g.add(sh);
  g.position.set(LAMP.x, LAMP.y, LAMP.z);
  scene.add(g);
  meshes.push(base, rod, sh);
  return { group:g, shade:sh };
}
const lamp = makeLamp();

/* ---------- 桌上其它物件 ---------- */
// 椅子
const chair = new THREE.Group();
const cmat = new THREE.MeshStandardMaterial({ map: woodTex(0x4a3319,0x2b1c0d,512,256), roughness:0.78 });
const seat = new THREE.Mesh(new THREE.BoxGeometry(1.0,0.12,0.95), cmat);
seat.position.y = 0.5; seat.castShadow = true; chair.add(seat);
[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{
  const l = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.5,0.1), cmat);
  l.position.set(sx*0.42, 0.25, sz*0.4); l.castShadow = true; chair.add(l);
});
const chairBack = new THREE.Mesh(new THREE.BoxGeometry(1.0,0.95,0.1), cmat);
chairBack.position.set(0, 1.03, -0.42); chairBack.castShadow = true; chair.add(chairBack);
[[-1],[1]].forEach(([sx])=>{
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.95,0.1), cmat);
  b.position.set(sx*0.42, 1.03, -0.42); b.castShadow = true; chair.add(b);
});
chair.position.set(DESK.x, 0, DESK.z + DESK.d/2 + 0.75);
chair.rotation.y = Math.PI;
scene.add(chair); meshes.push(...chair.children);

// 桌上一本摊开的书
const openBook = add(new THREE.Group(), true, false);
const obLeft = new THREE.Mesh(new THREE.BoxGeometry(0.72,0.05,0.5),
  new THREE.MeshStandardMaterial({ color:0xefe4cd, roughness:0.85 }));
obLeft.position.set(-0.37,0.03,0); obLeft.rotation.y = 0.09; obLeft.castShadow = true; openBook.add(obLeft);
const obRight = new THREE.Mesh(new THREE.BoxGeometry(0.72,0.05,0.5),
  new THREE.MeshStandardMaterial({ color:0xefe4cd, roughness:0.85 }));
obRight.position.set(0.37,0.03,0); obRight.rotation.y = -0.09; obRight.castShadow = true; openBook.add(obRight);
openBook.position.set(DESK.x-0.55, DESK.top, DESK.z+0.35);
openBook.rotation.y = 0.35;

// 钢笔
const pen = add(new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.42,12),
  new THREE.MeshStandardMaterial({ color:0x2f3d38, roughness:0.35, metalness:0.5 })), true, false);
pen.position.set(DESK.x-0.2, DESK.top+0.03, DESK.z-0.25);
pen.rotation.set(0,0.4,Math.PI/2.4);

// 茶杯
const cup = add(new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.085,0.16,20),
  new THREE.MeshStandardMaterial({ color:0xeee3cb, roughness:0.5 })), true, false);
cup.position.set(DESK.x+1.05, DESK.top+0.085, DESK.z+0.55);
const handle = add(new THREE.Mesh(new THREE.TorusGeometry(0.05,0.014,10,20,Math.PI*1.3),
  new THREE.MeshStandardMaterial({ color:0xeee3cb, roughness:0.5 })), true, false);
handle.position.set(DESK.x+1.16, DESK.top+0.085, DESK.z+0.55);
handle.rotation.y = Math.PI/2;

// 便签（可点击可编辑）
const noteMat = new THREE.MeshStandardMaterial({ map: noteTex(''), roughness:0.85 });
const note = add(new THREE.Mesh(new THREE.PlaneGeometry(0.62,0.465), noteMat), true, false);
note.position.set(DESK.x+0.35, DESK.top+0.005, DESK.z-0.62);
note.rotation.x = -Math.PI/2.35;
note.rotation.z = 0.12;
note.userData = { note:true, hoverable:true };

/* ---------- 地毯 ---------- */
const rug = add(new THREE.Mesh(new THREE.PlaneGeometry(5.6,4.4),
  new THREE.MeshStandardMaterial({ map: rugTex(), roughness:0.95 })), true, true);
rug.rotation.x = -Math.PI/2;
rug.position.set(0.6, 0.012, 0.9);

/* ---------- 墙上挂画/装饰 ---------- */
const pic = add(new THREE.Mesh(new THREE.BoxGeometry(1.5,1.9,0.09),
  new THREE.MeshStandardMaterial({ map: woodTex(0x8a6a3a,0x5a4020,384,512), roughness:0.5 })), true, false);
pic.position.set(-2.4, 3.6, -ROOM.D/2+0.28);
const picIn = add(new THREE.Mesh(new THREE.PlaneGeometry(1.24,1.64),
  new THREE.MeshStandardMaterial({ map: rugTex(), roughness:0.7 })), false, false);
picIn.position.set(-2.4, 3.6, -ROOM.D/2+0.335);

/* ============================================================
   灯光
   ============================================================ */
const amb = new THREE.AmbientLight(0x9fb2b0, 0.5);
scene.add(amb);

const hemi = new THREE.HemisphereLight(0xc6d3d8, 0x3a3026, 0.72);
hemi.position.set(0, 6, 2);
scene.add(hemi);

// 书架暗部补光（消除中间刺眼光斑附近的死黑）
const shelfFill = new THREE.PointLight(0xffe2b4, 0.42, 9, 2.2);
shelfFill.position.set(SHELF.x-1.6, shelfYs[3]+0.7, SHELF.z+1.1);
scene.add(shelfFill);

// 主吊灯（天花板，暖光）
const ceilLight = new THREE.PointLight(0xffd9a0, 1.8, 18, 1.9);
ceilLight.position.set(0.6, ROOM.H-1.05, 0.5);
ceilLight.castShadow = true;
ceilLight.shadow.mapSize.set(1024,1024);
ceilLight.shadow.camera.near = 0.3;
ceilLight.shadow.camera.far = 20;
ceilLight.shadow.bias = -0.0006;
scene.add(ceilLight);
const ceilBulb = add(new THREE.Mesh(new THREE.SphereGeometry(0.14,16,16),
  new THREE.MeshStandardMaterial({ color:0xfff0c8, emissive:0xffd9a0, emissiveIntensity:1.0 })), false, false);
ceilBulb.position.copy(ceilLight.position);
const ceilWire = add(new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,1.0,8),
  new THREE.MeshStandardMaterial({ color:0x22201c })), false, false);
ceilWire.position.set(0.6, ROOM.H-0.55, 0.5);

// 台灯光
const lampLight = new THREE.PointLight(0xffc274, 2.0, 8.5, 2.0);
lampLight.position.set(LAMP.x, LAMP.y+1.42, LAMP.z);
lampLight.castShadow = true;
lampLight.shadow.mapSize.set(1024,1024);
lampLight.shadow.camera.near = 0.2;
lampLight.shadow.camera.far = 10;
lampLight.shadow.bias = -0.0008;
scene.add(lampLight);

// 窗光（方向光，模拟窗外天色）
const sunLight = new THREE.DirectionalLight(0x8fb4d6, 0.55);
sunLight.position.set(14, 7, -2);
sunLight.target.position.set(0, 2, 0);
scene.add(sunLight);
scene.add(sunLight.target);

// 书架内嵌灯带（压低亮度并避开书架中心，消除刺眼光斑）
const shelfLight = new THREE.PointLight(0xffdca8, 0.32, 5.2, 2.4);
shelfLight.position.set(SHELF.x+2.2, shelfYs[4]+0.75, SHELF.z+0.9);
scene.add(shelfLight);
const shelfLight2 = new THREE.PointLight(0xffdca8, 0.26, 5.0, 2.4);
shelfLight2.position.set(SHELF.x-2.0, shelfYs[4]+0.75, SHELF.z+0.9);
scene.add(shelfLight2);

/* ============================================================
   雨粒子
   ============================================================ */
const RAIN_N = 1400;
const rainGeo = new THREE.BufferGeometry();
const rPos = new Float32Array(RAIN_N*3);
const rVel = new Float32Array(RAIN_N);
// 只在窗外绘制：右墙外侧（x 从墙厚外缘到窗外 3.3m），z 覆盖窗宽范围
const rArea = { x0:ROOM.W/2+0.25, x1:ROOM.W/2+3.4, z0:WIN.cz-WIN.w/2-0.5, z1:WIN.cz+WIN.w/2+0.5,
  y0:ROOM.H-0.35, y1:0.35 };
for(let i=0;i<RAIN_N;i++){
  rPos[i*3]   = rArea.x0 + Math.random()*(rArea.x1-rArea.x0);
  rPos[i*3+1] = Math.random()*(rArea.y0-rArea.y1)+rArea.y1;
  rPos[i*3+2] = rArea.z0 + Math.random()*(rArea.z1-rArea.z0);
  rVel[i] = 0.11 + Math.random()*0.17;
}
rainGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));
const rainMat = new THREE.PointsMaterial({
  color:0xaec6d6, size:0.028, transparent:true, opacity:0.62,
  depthWrite:false, fog:true });
const rain = new THREE.Points(rainGeo, rainMat);
rain.visible = true;
rain.renderOrder = 5;
scene.add(rain);

/* ============================================================
   视角
   ============================================================ */
const VIEWS = {
  pano:   { pos:HOME.pos.clone(), tgt:HOME.tgt.clone() },
  shelf:  { pos:new THREE.Vector3(-3.1, 2.55, 3.9), tgt:new THREE.Vector3(SHELF.x+1.0, 2.6, SHELF.z) },
  desk:   { pos:new THREE.Vector3(0.6, 2.5, 4.6),  tgt:new THREE.Vector3(DESK.x-0.1, DESK.top+0.25, DESK.z-0.2) },
  window: { pos:new THREE.Vector3(2.9, 3.0, 2.9),  tgt:new THREE.Vector3(WIN.cx-0.6, WIN.cy-0.15, WIN.cz-0.4) }
};
// 相机平滑过渡
let camFrom = null, camTo = null, camT = 1, camDur = 1.0;
function gotoView(key, dur=1.15){
  const v = VIEWS[key] || VIEWS.pano;
  camFrom = { pos:camera.position.clone(), tgt:controls.target.clone() };
  camTo = { pos:v.pos.clone(), tgt:v.tgt.clone() };
  camT = 0; camDur = dur;
  controls.enabled = false;
}
const easeInOut = t => t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;

/* ============================================================
   天气切换
   ============================================================ */
const weatherCfg = {
  rain: { amb:0x9fb2b0, ambI:0.5, hemi:0x5a6e76, hemiI:0.72, sun:0x8fb4d6, sunI:0.4,
          ceilC:0xffd9a0, ceilI:1.8, lampC:0xffc274, lampI:2.0, shelfI:0.32,
          expo:1.3, fog:0x101a16, rain:true, sky:'rain' },
  sun:  { amb:0xc9bda4, ambI:0.72, hemi:0xcfd8de, hemiI:0.95, sun:0xffe6b8, sunI:1.35,
          ceilC:0xfff0c0, ceilI:1.0, lampC:0xffd28a, lampI:0.45, shelfI:0.26,
          expo:1.42, fog:0x1a221c, rain:false, sky:'sun' }
};
let wCur = 'rain', wT = 1, wFrom = null, wTo = weatherCfg.rain;
function setWeather(k){
  if(!weatherCfg[k] || k===wCur) return;
  wFrom = snapWeather(wCur); wTo = weatherCfg[k]; wT = 0; wCur = k;
  S.weather = k;
  sky.material.map = skyTex(k);
  sky.material.needsUpdate = true;
  rain.visible = k==='rain';
}
function snapWeather(k){
  return { ambI:amb.intensity, hemiI:hemi.intensity, sunI:sunLight.intensity,
    ceilI:ceilLight.intensity, lampI:lampLight.intensity, shelfI:shelfLight.intensity,
    expo:renderer.toneMappingExposure };
}
function applyWeather(c, a){
  amb.intensity = lerp(c.ambI, a.ambI, wT);
  hemi.intensity = lerp(c.hemiI, a.hemiI, wT);
  sunLight.intensity = lerp(c.sunI, a.sunI, wT);
  ceilLight.intensity = lerp(c.ceilI, a.ceilI, wT);
  lampLight.intensity = lerp(c.lampI, a.lampI, wT);
  shelfLight.intensity = lerp(c.shelfI, a.shelfI, wT);
  renderer.toneMappingExposure = lerp(c.expo, a.expo, wT);
  amb.color.setHex(a.amb); hemi.color.setHex(a.hemi); sunLight.color.setHex(a.sun);
  ceilLight.color.setHex(a.ceilC); lampLight.color.setHex(a.lampC);
  scene.fog.color.setHex(a.fog);
}

/* ============================================================
   交互：射线、悬停、点击
   ============================================================ */
const raycaster = new THREE.Raycaster();
const ptr = new THREE.Vector2();
let hoverObj = null, downPos = null;

function setPtr(e){
  const t = e.touches ? e.touches[0] : e;
  ptr.x = (t.clientX/innerWidth)*2 - 1;
  ptr.y = -(t.clientY/innerHeight)*2 + 1;
}
function pickable(o){
  return o && (o.userData.hoverable === true);
}
renderer.domElement.addEventListener('pointerdown', e=>{
  if(e.button!==undefined && e.button!==0) return;
  downPos = { x:e.clientX, y:e.clientY };
});
renderer.domElement.addEventListener('pointermove', e=>{
  if(S.typing) return;
  setPtr(e);
  raycaster.setFromCamera(ptr, camera);
  const hits = raycaster.intersectObjects(bookMeshes.concat([note]), false);
  const obj = hits.length ? hits[0].object : null;
  if(obj !== hoverObj){
    if(hoverObj) hoverObj.userData.tgt = 0;
    hoverObj = obj;
    if(hoverObj) hoverObj.userData.tgt = 1;
    const tip = $('#booktip');
    if(obj && obj.userData.book !== undefined){
      tip.textContent = '点击阅读 ·《' + BOOKS[obj.userData.book].title + '》';
      tip.classList.add('show');
    } else if(obj && obj.userData.note){
      tip.textContent = '点击编辑便签';
      tip.classList.add('show');
    } else tip.classList.remove('show');
  }
});
renderer.domElement.addEventListener('pointerup', e=>{
  if(!downPos) return;
  const dx = e.clientX - downPos.x, dy = e.clientY - downPos.y;
  downPos = null;
  if(Math.abs(dx)>8 || Math.abs(dy)>8) return;   // 拖动不算点击
  if(S.typing) return;
  setPtr(e);
  raycaster.setFromCamera(ptr, camera);
  const hits = raycaster.intersectObjects(bookMeshes.concat([note]), false);
  if(!hits.length) return;
  const o = hits[0].object;
  if(o.userData.book !== undefined) openReader(o.userData.book);
  else if(o.userData.note) openNote();
});

/* ============================================================
   UI 面板
   ============================================================ */
function openReader(i){
  if(immersive){immersive.openBook(i); return;}
  if(S.noteOpen) closeNote();
  const b = BOOKS[i];
  S.selectedBook = i;
  $('#rk').textContent = 'NO.0' + (i+1);
  $('#rt').textContent = '《' + b.title + '》';
  $('#rm').textContent = b.meta;
  $('#rp').textContent = b.body;
  $('#rf').textContent = '—— 雨夜书房 · 深夜阅读室';
  $('#reader').classList.add('open');
  S.readerOpen = true;
  syncPanelBlock();
}
function closeReader(){
  if(immersive){immersive.close(); return;}
  $('#reader').classList.remove('open');
  S.readerOpen = false; S.selectedBook = null;
  syncPanelBlock();
}
$('#rclose').addEventListener('click', closeReader);

document.querySelectorAll('.kbtn[data-book]').forEach(b=>{
  b.addEventListener('click', ()=> openReader(+b.dataset.book));
});

/* ---------- 便签 ---------- */
function loadNote(){
  try{
    const v = localStorage.getItem(NOTE_KEY);
    S.noteText = (v || '').slice(0,400);
  }catch(e){ S.noteText = ''; }
  refreshNote();
}
function refreshNote(){
  noteMat.map = noteTex(S.noteText);
  noteMat.needsUpdate = true;
}
function openNote(){
  if(immersive){immersive.openWriting(); return;}
  if(S.readerOpen) closeReader();
  $('#ntext').value = S.noteText;
  $('#note').classList.add('open');
  S.noteOpen = true; S.typing = true;
  $('#nstat').textContent = S.noteText ? '已保存于本机' : '未保存';
  $('#nstat').className = S.noteText ? 'ok' : '';
  setTimeout(()=> $('#ntext').focus(), 60);
  syncPanelBlock();
}
function closeNote(){
  if(immersive){immersive.close(); return;}
  $('#note').classList.remove('open');
  S.noteOpen = false; S.typing = false;
  syncPanelBlock();
}
$('#nclose').addEventListener('click', closeNote);
$('#open-note').addEventListener('click', openNote);
$('#nsave').addEventListener('click', ()=>{
  const v = $('#ntext').value.slice(0,400);
  try{
    localStorage.setItem(NOTE_KEY, v);
    S.noteText = v;
    refreshNote();
    const st = $('#nstat');
    st.textContent = '已保存 · ' + new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
    st.className = 'ok';
    toast('留言已保存，刷新后仍会保留');
  }catch(e){
    const st = $('#nstat'); st.textContent = '保存失败'; st.className = 'warn';
    toast('保存失败：浏览器拒绝了存储');
  }
});
$('#nclear').addEventListener('click', ()=>{
  $('#ntext').value = '';
  localStorage.removeItem(NOTE_KEY);
  S.noteText = '';
  refreshNote();
  const st = $('#nstat'); st.textContent = '未保存'; st.className = '';
  toast('便签已清空');
});
$('#ntext').addEventListener('input', e=>{
  const st = $('#nstat');
  st.textContent = '编辑中…'; st.className = 'warn';
});
$('#ntext').addEventListener('blur', ()=>{ S.typing = S.noteOpen; });
$('#ntext').addEventListener('focus', ()=>{ S.typing = true; });
loadNote();

/* ---------- toast ---------- */
let toastTimer = null;
function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> t.classList.remove('show'), 2400);
}

/* ---------- 面板互斥与背景拖动屏蔽 ---------- */
const uiPanels = ['#reader', '#note', '#side'];
function syncPanelBlock(){
  const blocking = S.readerOpen || S.noteOpen;
  renderer.domElement.style.pointerEvents = blocking ? 'none' : 'auto';
  controls.enabled = !blocking && camT >= 1;
}
function closeAllPanels(){
  if(S.readerOpen) closeReader();
  if(S.noteOpen) closeNote();
}

/* ---------- 侧栏折叠（手机默认收起） ---------- */
const sideEl = $('#side');
const sideToggle = $('#side-toggle');
let sideOpen = true;
function setSide(open){
  sideOpen = open;
  sideEl.classList.toggle('collapsed', !open);
  sideEl.classList.toggle('floating', open && innerWidth <= 760);
  sideToggle.textContent = open ? '收起工具' : '展开工具';
}
sideToggle.addEventListener('click', ()=> setSide(!sideOpen));
if(innerWidth <= 760) setSide(false);
document.querySelectorAll('#side .kbtn, #side .wbtn, #side #reset').forEach(b=>{
  b.addEventListener('click', ()=>{ if(innerWidth <= 760) setSide(false); });
});
addEventListener('resize', ()=>{
  if(innerWidth <= 760 && sideOpen) sideEl.classList.add('floating');
  else sideEl.classList.remove('floating');
});

/* ---------- 收藏视角 ---------- */
const VIEW_KEY = 'afterhours.view.v1';
function saveView(){
  try{
    localStorage.setItem(VIEW_KEY, JSON.stringify({
      pos:{ x:camera.position.x, y:camera.position.y, z:camera.position.z },
      tgt:{ x:controls.target.x, y:controls.target.y, z:controls.target.z }
    }));
    toast('已收藏此刻视角 · 刷新后仍可回到这里');
  }catch(e){ toast('收藏失败：浏览器拒绝了存储'); }
}
function restoreView(){
  let v = null;
  try{ v = JSON.parse(localStorage.getItem(VIEW_KEY) || 'null'); }catch(e){ v = null; }
  if(!v || !v.pos || !v.tgt){ toast('尚未收藏视角 · 先拖动构图后再收藏'); return; }
  camFrom = { pos:camera.position.clone(), tgt:controls.target.clone() };
  camTo = { pos:new THREE.Vector3(v.pos.x, v.pos.y, v.pos.z),
            tgt:new THREE.Vector3(v.tgt.x, v.tgt.y, v.tgt.z) };
  camT = 0; camDur = 1.25;
  controls.enabled = false;
  document.querySelectorAll('.vbtn').forEach(x=>x.classList.remove('active'));
  S.view = 'saved';
  toast('已回到收藏视角');
}
$('#save-view').addEventListener('click', saveView);
$('#restore-view').addEventListener('click', restoreView);

/* ---------- 视角按钮 ---------- */
document.querySelectorAll('.vbtn').forEach(b=>{
  b.addEventListener('click', ()=>{
    document.querySelectorAll('.vbtn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    S.view = b.dataset.view;
    gotoView(S.view);
  });
});
$('#reset').addEventListener('click', ()=>{
  closeAllPanels();
  document.querySelectorAll('.vbtn').forEach(x=>x.classList.remove('active'));
  document.querySelector('.vbtn[data-view="pano"]').classList.add('active');
  S.view = 'pano';
  camFrom = { pos:camera.position.clone(), tgt:controls.target.clone() };
  camTo = { pos:HOME.pos.clone(), tgt:HOME.tgt.clone() };
  camT = 0; camDur = 1.3;
  controls.enabled = false;
  toast('已回到初始视角');
});

/* ---------- 天气按钮 ---------- */
document.querySelectorAll('.wbtn[data-weather]').forEach(b=>{
  b.addEventListener('click', ()=>{
    document.querySelectorAll('.wbtn').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
    setWeather(b.dataset.weather);
    toast(b.dataset.weather==='rain' ? '已切换至雨夜' : '已切换至晴日');
  });
});

/* ---------- 键盘 ---------- */
addEventListener('keydown', e=>{
  if(e.key === 'Escape'){
    if(S.readerOpen) closeReader();
    else if(S.noteOpen){ $('#ntext').blur(); closeNote(); }
    else if(sideOpen && innerWidth <= 760) setSide(false);
    return;
  }
  if(e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT')) return;
  if(S.typing) return;
  const k = e.key.toLowerCase();
  if(k==='1'||k==='2'||k==='3') openReader(+k-1);
  else if(k==='v') document.querySelector('.vbtn[data-view="pano"]').click();
  else if(k==='w') document.querySelector(`.wbtn[data-weather="${S.weather==='rain'?'sun':'rain'}"]`).click();
});

/* ---------- 尺寸 ---------- */
function onResize(){
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', onResize);
addEventListener('orientationchange', onResize);

/* ============================================================
   测试接口（只读观测，不替代真实 UI 操作）
   ============================================================ */
window.__STUDY_TEST__ = Object.freeze({
  snapshot(){
    return {
      weather: S.weather,
      cameraPosition: { x:+camera.position.x.toFixed(3), y:+camera.position.y.toFixed(3), z:+camera.position.z.toFixed(3) },
      selectedBook: S.selectedBook,
      noteText: S.noteText,
      ready: !!S.ready,
      meshCount: meshes.length,
      immersive: immersive?.snapshot(),
      children: children?.snapshot()
    };
  }
});

/* ============================================================
   加载流程
   ============================================================ */
const steps = [
  ['构 造 房 间', 0.18],
  ['排 列 书 脊', 0.42],
  ['点 燃 灯 火', 0.68],
  ['等 一 场 雨', 0.88],
  ['深 夜 就 绪', 1.0]
];
let loaded = false;
function finish(){
  if(loaded) return; loaded = true;
  const bar = $('#lbar i');
  bar.style.width = '100%';
  setTimeout(()=>{
    $('#loader').classList.add('hide');
    S.ready = true;
    setTimeout(()=> toast('深夜书房已就绪 · 拖动浏览'), 500);
  }, 420);
}
(function boot(){
  const bar = $('#lbar i');
  let i = 0;
  const tick = ()=>{
    if(i<steps.length){
      bar.style.width = (steps[i][1]*100)+'%';
      i++; setTimeout(tick, 300);
    } else finish();
  };
  tick();
  // 兜底：保证 ready 一定能置位
  setTimeout(finish, 3400);
})();

/* ============================================================
   主循环
   ============================================================ */
immersive=createImmersive({scene,camera,controls,renderer,S,bookMeshes,note,pen,DESK,WIN,ROOM,glass,sky,rain,toast,openBook});
children=createChildren({scene,camera,renderer,controls,S});
const clock = new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.getElapsedTime();

  // 相机过渡
  if(camT < 1){
    camT = Math.min(1, camT + dt/camDur);
    const e = easeInOut(camT);
    camera.position.lerpVectors(camFrom.pos, camTo.pos, e);
    controls.target.lerpVectors(camFrom.tgt, camTo.tgt, e);
    if(camT >= 1) controls.enabled = !(S.readerOpen || S.noteOpen);
  }
  controls.update();

  // 天气过渡
  if(wT < 1){
    wT = Math.min(1, wT + dt/1.1);
    applyWeather(wFrom, wTo);
  }

  // 雨更新（仅在窗外区域循环）
  if(rain.visible){
    const p = rainGeo.attributes.position.array;
    for(let i=0;i<RAIN_N;i++){
      p[i*3+1] -= rVel[i] * dt * 55;
      p[i*3] += dt * 0.55;
      if(p[i*3+1] < rArea.y1){
        p[i*3+1] = rArea.y0;
        p[i*3] = rArea.x0 + Math.random()*(rArea.x1-rArea.x0);
        p[i*3+2] = rArea.z0 + Math.random()*(rArea.z1-rArea.z0);
      }
      if(p[i*3] > rArea.x1) p[i*3] = rArea.x0;
    }
    rainGeo.attributes.position.needsUpdate = true;
  }

  // 书本悬停抬升
  for(const bm of bookMeshes){
    if(bm.userData.baseY === undefined) bm.userData.baseY = bm.position.y;
    const cur = bm.userData.off || 0;
    const tgt = bm.userData.tgt || 0;
    bm.userData.off = lerp(cur, tgt, 0.12);
    bm.position.y = bm.userData.baseY + bm.userData.off * 0.16;
    bm.rotation.y = bm.userData.off * 0.22;
  }
  // 便签悬停
  if(note.userData.baseY === undefined) note.userData.baseY = note.position.y;
  note.userData.off = lerp(note.userData.off||0, note.userData.tgt||0, 0.12);
  note.userData.off = clamp(note.userData.off, 0, 1.5);
  note.position.y = note.userData.baseY + note.userData.off * 0.05;
  if(note.material.emissive){
    note.material.emissive.setRGB(note.userData.off*0.06, note.userData.off*0.05, 0);
  } else {
    note.material.emissive = new THREE.Color(note.userData.off*0.06, note.userData.off*0.05, 0);
  }

  // 灯火呼吸
  lampLight.intensity = (wCur==='rain' ? 2.0 : 0.45) + Math.sin(t*1.7)*0.05;
  shelfFill.intensity = (wCur==='rain' ? 0.42 : 0.3) + Math.sin(t*0.9)*0.03;
  shelfLight2.intensity = (wCur==='rain' ? 0.26 : 0.2) + Math.sin(t*1.1)*0.02;
  ceilBulb.material.emissiveIntensity = 0.9 + Math.sin(t*1.3)*0.08;

  immersive?.update(t,dt);
  children?.update(t,dt);
  renderer.render(scene, camera);
}
animate();
