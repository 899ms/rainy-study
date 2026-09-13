import * as THREE from 'three';

// Codex V2: animated refrbeadMask-window approximation and procedural room rain audio.
export function createWeather({scene,glass,sky,camera,WIN,ROOM,rain}) {
 const uniforms={uTime:{value:0},uRain:{value:1},uSky:{value:sky.material.map}};
 const mat=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`precision highp float;varying vec2 vUv;uniform float uTime;uniform float uRain;uniform sampler2D uSky;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 void main(){vec2 uv=vUv;vec2 offset=vec2(0.);float rim=0.;float shade=0.;float mist=0.;
 for(int layer=0;layer<3;layer++){float l=float(layer);vec2 grid=vec2(23.+l*13.,17.+l*9.);vec2 id=floor(uv*grid);float h=hash(id+l*71.);vec2 p=fract(uv*grid)-vec2(.3+.4*h,.3+.4*hash(id+93.));float radius=.09+.15*h;float d=length(p*vec2(1.,1.15));float body=1.-smoothstep(radius*.65,radius,d);float edge=smoothstep(radius*.6,radius*.8,d)*(1.-smoothstep(radius*.8,radius,d));float beadMask=step(.54,h);offset+=p*body*beadMask*.045;rim+=edge*beadMask*(.06+.09*max(0.,p.y/radius));shade+=body*beadMask*.08;mist+=body*.014;}
 for(int i=0;i<11;i++){float fi=float(i);float h=hash(vec2(fi,21.));float cx=.045+fi*.085+sin(uTime*.37+fi)*.002;float cy=fract(h-uTime*(.027+.018*h));float dx=uv.x-cx;float dy=uv.y-cy;float r=.006+h*.005;float d=length(vec2(dx,dy*.62));float drop=1.-smoothstep(r*.62,r,d);float trail=(1.-smoothstep(.001,.0025,abs(dx+sin(uv.y*39.+fi)*.001)))*smoothstep(0.,.025,dy)*(1.-smoothstep(.04,.18,dy));offset+=vec2(dx,dy*.5)*drop*1.7;offset.x+=trail*.002;rim+=(smoothstep(r*.55,r*.78,d)*(1.-smoothstep(r*.8,r,d)))*.22+trail*.036;shade+=drop*.1;}
 vec3 col=texture2D(uSky,clamp(uv+offset*uRain,0.,1.)).rgb;
 col=col*(1.-shade*uRain)+vec3(.62,.75,.83)*rim*uRain;col=mix(col,vec3(.24,.32,.35),mist*uRain);
 // A restrained warm reflection from the lamp, away from the central view.
 float warmReflection=pow(max(0.,1.-length((uv-vec2(.08,.3))*vec2(2.,1.))),6.);
 col+=vec3(.22,.13,.055)*warmReflection*uRain;gl_FragColor=vec4(col,uRain*.76+(1.-uRain)*.10);}`});
 glass.position.x=WIN.cx-.03;glass.material.dispose();glass.material=mat;glass.renderOrder=3;
 // Long streaks outside replace snow-like point sprites.
 rain.visible=false;
 const n=420,pos=new Float32Array(n*6),speeds=new Float32Array(n),lengths=new Float32Array(n);
 for(let i=0;i<n;i++){pos[i*6]=ROOM.W/2+.3+Math.random()*2.8;pos[i*6+1]=Math.random()*ROOM.H;pos[i*6+2]=WIN.cz+(Math.random()-.5)*(WIN.w+.3);speeds[i]=3+Math.random()*4;lengths[i]=.08+Math.random()*.19;}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
 const lines=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0xb7ccd2,transparent:true,opacity:.19,depthWrite:false}));scene.add(lines);
 let audio=null,enabled=false,volume=.36,wet=1,lastWeather='rain';
 function initAudio(){
  const ctx=new (window.AudioContext||window.webkitAudioContext)();const output=ctx.createGain();output.gain.value=0;output.connect(ctx.destination);
  const soft=ctx.createBiquadFilter();soft.type='lowpass';soft.frequency.value=1800;soft.Q.value=.3;soft.connect(output);
  const nodes=[];
  function noise(type,gain,hp,lp){const len=ctx.sampleRate*19,buffer=ctx.createBuffer(2,len,ctx.sampleRate);for(let ch=0;ch<2;ch++){const a=buffer.getChannelData(ch);let brown=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;brown=(brown+.018*w)/1.018;a[i]=type==='brown'?brown*4:w*.38;}}const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;const high=ctx.createBiquadFilter();high.type='highpass';high.frequency.value=hp;const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=lp;const g=ctx.createGain();g.gain.value=gain;source.connect(high);high.connect(low);low.connect(g);g.connect(soft);source.start();nodes.push(source);}
  noise('brown',.72,70,700);noise('white',.2,900,6500);noise('white',.1,250,2100);
  // Gust modulation avoids a static uniform hiss.
  const lfo=ctx.createOscillator();const lfoGain=ctx.createGain();lfo.frequency.value=.073;lfoGain.gain.value=.065;lfo.connect(lfoGain);lfoGain.connect(output.gain);lfo.start();
  return {ctx,output,soft,lfoGain,nextDrop:0};
 }
 async function toggle(){try{if(!audio)audio=initAudio();await audio.ctx.resume();enabled=!enabled;document.querySelector('#sound-toggle').textContent=enabled?'雨声已开启 · 点击关闭':'开启窗外雨声';document.querySelector('#sound-toggle').setAttribute('aria-pressed',String(enabled));}catch{document.querySelector('#sound-toggle').textContent='浏览器暂不能播放音频';}}
 const panel=document.createElement('div');panel.innerHTML=`<div class="sect-t">AMBIENCE</div><button id="sound-toggle" aria-pressed="false" style="margin-top:8px">开启窗外雨声</button><input id="sound-volume" type="range" min="0" max="100" value="36" aria-label="雨声音量"><div class="sound-label"><span>近窗更清晰 · 晴日渐静</span><span>合成声场</span></div>`;
 document.querySelector('#side').append(panel);panel.querySelector('button').onclick=toggle;panel.querySelector('input').oninput=e=>{volume=Number(e.target.value)/100;};
 function update(t,dt,weather){wet=THREE.MathUtils.damp(wet,weather==='rain'?1:0,2.2,dt);uniforms.uTime.value=t;uniforms.uRain.value=wet;uniforms.uSky.value=sky.material.map;lines.visible=wet>.02;rain.visible=false;lines.material.opacity=.20*wet;
  for(let i=0;i<n;i++){let k=i*6;pos[k+1]-=speeds[i]*dt;if(pos[k+1]<0)pos[k+1]=ROOM.H;pos[k+3]=pos[k]-.015;pos[k+4]=pos[k+1]+lengths[i];pos[k+5]=pos[k+2];}geo.attributes.position.needsUpdate=true;
  if(audio){const near=1-Math.min(1,camera.position.distanceTo(new THREE.Vector3(WIN.cx,WIN.cy,WIN.cz))/12);const target=enabled?volume*wet*(.16+near*.17):0;audio.output.gain.setTargetAtTime(target,audio.ctx.currentTime,.25);audio.lfoGain.gain.setTargetAtTime(enabled?target*.12:0,audio.ctx.currentTime,.2);audio.soft.frequency.setTargetAtTime(900+near*2400,audio.ctx.currentTime,.3);
   if(enabled&&wet>.2&&audio.ctx.currentTime>audio.nextDrop){audio.nextDrop=audio.ctx.currentTime+.08+Math.random()*.32;const c=audio.ctx,buf=c.createBuffer(1,Math.floor(c.sampleRate*.055),c.sampleRate),arr=buf.getChannelData(0);for(let j=0;j<arr.length;j++)arr[j]=(Math.random()*2-1)*Math.exp(-j/(c.sampleRate*.009));const s=c.createBufferSource();s.buffer=buf;const filter=c.createBiquadFilter();filter.type='bandpass';filter.frequency.value=1300+Math.random()*2700;filter.Q.value=.7;const g=c.createGain();g.gain.value=.12+Math.random()*.15;const pan=c.createStereoPanner();pan.pan.value=(Math.random()-.5)*1.4;s.connect(filter);filter.connect(g);g.connect(pan);pan.connect(audio.soft);s.start();s.onended=()=>{s.disconnect();filter.disconnect();g.disconnect();pan.disconnect();};}
  }lastWeather=weather;
 }
 return {update,snapshot:()=>({audioEnabled:enabled,audioState:audio?.ctx.state||'not-started',volume,wetness:+wet.toFixed(3),weather:lastWeather,glassDroplets:true})};
}
