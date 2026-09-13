// Shared tactile sequence: lift the selected cover, hinge it open, reveal the pages.
export function createBookOpening(){
 let generation=0,animations=[],layer=null,source=null,phase='idle';
 function cancel(){generation++;animations.forEach(a=>a.cancel());animations=[];layer?.remove();layer=null;if(source)source.style.opacity='';source=null;phase='idle'}
 async function run(cover,rect,reveal){cancel();const token=generation;source=cover;if(cover)cover.style.opacity='0';const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  layer=document.createElement('div');layer.className='cover-opening-layer';layer.setAttribute('aria-hidden','true');layer.innerHTML='<div class="opening-volume"><div class="opening-left-page"></div><div class="opening-right-page"><span>让故事，从纸上站起来</span></div><div class="opening-hinge"></div><div class="opening-leaves"></div></div>';document.body.append(layer);
  const shell=layer.querySelector('.opening-volume'),hinge=layer.querySelector('.opening-hinge');const innerImage=cover.querySelector('img').cloneNode();layer.querySelector('.opening-left-page').append(innerImage);const title=document.createElement('strong');title.textContent=cover.querySelector('h2').textContent;layer.querySelector('.opening-right-page').prepend(title);const copy=cover.cloneNode(true);copy.style.opacity='1';copy.classList.add('opening-cover-art');hinge.append(copy);
  const w=Math.min(330,innerWidth*.43),h=w*1.5;const start=rect||{left:innerWidth/2-100,top:innerHeight/2-150,width:200,height:300};
  const animate=async(el,frames,options)=>{const a=el.animate(frames,{fill:'forwards',...options,duration:reduced?1:options.duration});animations.push(a);try{await a.finished}catch{}return token===generation};
  phase='lifting';layer.style.background='transparent';
  const lifted=await animate(shell,[{left:(start.left-start.width)+'px',top:start.top+'px',width:start.width*2+'px',height:start.height+'px',transform:'rotateX(0deg) rotateZ(-2deg)'},{left:(innerWidth/2-w)+'px',top:(innerHeight-h)/2+'px',width:w*2+'px',height:h+'px',transform:'rotateX(7deg) rotateZ(0deg)'}],{duration:650,easing:'cubic-bezier(.2,.8,.2,1)'});if(!lifted)return;
  phase='opening';layer.classList.add('unfolding');
  const opened=await animate(hinge,[{transform:'rotateY(0deg)'},{transform:'rotateY(-167deg)'}],{duration:950,easing:'cubic-bezier(.3,.05,.15,1)'});if(!opened)return;
  phase='revealing';reveal();
  await animate(layer,[{opacity:1},{opacity:0}],{duration:430,easing:'ease-out'});if(token===generation)cancel();
 }
 return{run,cancel,snapshot:()=>phase};
}
