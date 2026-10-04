import type {MatchOptions,Opponent} from './options.ts';import type {Sample} from './engine.ts';import {seededRandom,wrap} from './engine.ts';import {pointerPose} from './pointers.ts';
export interface Particle {x:number;y:number;vx:number;vy:number;life:number;maxLife:number;size:number;color:number}
export class MatchRenderer {
 effects:HTMLCanvasElement; fx:CanvasRenderingContext2D; canvas:HTMLCanvasElement; ctx:CanvasRenderingContext2D; spool:HTMLCanvasElement; spoolCtx:CanvasRenderingContext2D;
 revision=0; rows=new Map<string,HTMLCanvasElement>(); texture=new Image(); particles:Particle[]=[]; random=seededRandom(42); emission=0; w=1200;h=915;dpr=1;lastTime=-1;lastStage='';burstClock=0;
 constructor(canvas:HTMLCanvasElement,effects:HTMLCanvasElement){this.effects=effects;this.fx=effects.getContext('2d')!;this.canvas=canvas;this.ctx=canvas.getContext('2d')!;this.spool=document.createElement('canvas');this.spoolCtx=this.spool.getContext('2d')!;this.texture.src='/assets/red-nameplate.png';this.texture.onload=()=>{this.rows.clear();this.revision++;};void document.fonts.ready.then(()=>{this.rows.clear();this.revision++;});}
 resize(width:number,height:number){const dpr=Math.min(window.devicePixelRatio||1,3);if(width===this.w&&height===this.h&&dpr===this.dpr)return;this.rows.clear();this.revision++;this.w=width;this.h=height;this.dpr=dpr;this.canvas.width=Math.round(width*dpr);this.canvas.height=Math.round(height*dpr);this.effects.width=this.canvas.width;this.effects.height=this.canvas.height;this.spool.width=Math.round(width*.328*dpr);this.spool.height=Math.round(height*.452*dpr);}
 reset(seed:number){this.revision++;this.random=seededRandom(seed);this.particles=[];this.emission=0;this.lastTime=-1;this.lastStage='';this.burstClock=0;}
 emit(count:number,o:MatchOptions,s:Sample,burst=false){for(let i=0;i<count;i++){
  const side=this.random()>.5?1:-1,angle=.15+this.random()*1.2;
  const speed=(45+this.random()*o.particleSpeed*1.6)*(burst?1.6:1),life=o.life*(.65+this.random()*.8);
  const source=pointerPose(s,side,o.pointerShake);
  this.particles.push({x:source.x+(this.random()-.5)*8,y:source.y+this.random()*6,
   vx:side*Math.cos(angle)*speed,vy:Math.sin(angle)*speed-15,life,maxLife:life,
   size:o.particleSize*(.45+this.random()*.9),color:this.random()});
 }if(this.particles.length>700)this.particles.splice(0,this.particles.length-700);}
 render(s:Sample,o:MatchOptions,names:Opponent[],paused:boolean,dt:number){
  const c=this.ctx;const sx=this.w/1200,sy=this.h/915;c.setTransform(this.dpr*sx,0,0,this.dpr*sy,0,0);c.clearRect(0,0,1200,915);
  const left=411,top=200,width=394,height=414;const center=height/2;const sc=this.spoolCtx;const sw=this.spool.width/this.dpr,sh=this.spool.height/this.dpr;
  sc.setTransform(this.dpr,0,0,this.dpr,0,0);sc.clearRect(0,0,sw,sh);sc.save();sc.scale(sw/width,sh/height);sc.fillStyle='#130604';sc.fillRect(0,0,width,height);
  const fraction=s.offset-Math.floor(s.offset);const angle=.34;const rad=height*.515;
  for(let k=-6;k<=6;k++){
   const row=k-fraction,a=row*angle;if(Math.abs(a)>1.57)continue;
   const y=center+rad*Math.sin(a),rowH=2*rad*Math.sin(angle/2)*Math.cos(a);const index=wrap(Math.floor(s.offset)+k,names.length);
   const rw=width*(.96+.04*Math.cos(a)),x=(width-rw)/2;
   const text=names[index]?.name||'';const key=`${o.fontSize}:${text}`;let rowImage=this.rows.get(key);
   if(!rowImage){rowImage=document.createElement('canvas');const density=this.dpr*this.w/1200;rowImage.width=Math.max(1,Math.round(width*density));rowImage.height=Math.max(1,Math.round(72*density));const rc=rowImage.getContext('2d')!;rc.scale(rowImage.width/width,rowImage.height/72);
    if(this.texture.complete&&this.texture.naturalWidth){rc.filter='brightness(1.45) saturate(1.2)';rc.drawImage(this.texture,0,0,width,72);rc.filter='none';}
    let size=o.fontSize;rc.font=`700 ${size}px "Noto Serif SC", serif`;while(rc.measureText(text).width>width-36&&size>12){size-=1;rc.font=`700 ${size}px "Noto Serif SC", serif`;}
    rc.textAlign='center';rc.textBaseline='middle';rc.lineWidth=4;rc.strokeStyle='#241007';rc.lineJoin='round';rc.strokeText(text,width/2,36);rc.fillStyle='#fff0da';rc.fillText(text,width/2,36);this.rows.set(key,rowImage);if(this.rows.size>160)this.rows.delete(this.rows.keys().next().value!);
   }
   sc.drawImage(rowImage,x,y-rowH/2,rw,rowH+1);
   const shade=1-Math.cos(a);sc.fillStyle=`rgba(0,0,0,${.06+shade*.68})`;sc.fillRect(x,y-rowH/2,rw,rowH+1);
  }
  sc.restore();c.save();c.beginPath();c.rect(left,top,width,height);c.clip();
  const blur=Math.min(1,Math.abs(s.velocity)/12)*o.blur;
  c.drawImage(this.spool,left,top,width,height);
  if(blur>1){for(let k=-5;k<=5;k++){c.globalAlpha=.25;c.drawImage(this.spool,left,top+k*blur*2.7,width,height);}}
  c.globalAlpha=1;
  const heat=Math.min(1,Math.abs(s.velocity)/15);
  if(heat>0){const light=c.createLinearGradient(0,top,0,top+height);light.addColorStop(0,'rgba(255,30,0,0)');light.addColorStop(.25,`rgba(255,35,0,${heat*.12})`);light.addColorStop(.5,`rgba(255,48,0,${heat*.32})`);light.addColorStop(.75,`rgba(255,35,0,${heat*.12})`);light.addColorStop(1,'rgba(255,30,0,0)');c.globalCompositeOperation='screen';c.fillStyle=light;c.fillRect(left,top,width,height);c.globalCompositeOperation='source-over';}
  const shade=c.createLinearGradient(0,top,0,top+height);shade.addColorStop(0,'rgba(0,0,0,.94)');shade.addColorStop(.18,'rgba(0,0,0,.3)');shade.addColorStop(.44,'rgba(0,0,0,0)');shade.addColorStop(.56,'rgba(0,0,0,0)');shade.addColorStop(.82,'rgba(0,0,0,.25)');shade.addColorStop(1,'rgba(0,0,0,.95)');c.fillStyle=shade;c.fillRect(left,top,width,height);
  if(o.glow>0){c.fillStyle=`rgba(255,90,0,${.035*o.glow})`;c.fillRect(left,top+height*.4,width,height*.2);}c.restore();
  // Sparks must sit above the opaque metal frame, independently of the roller.
  const f=this.fx;f.setTransform(this.dpr*sx,0,0,this.dpr*sy,0,0);f.clearRect(0,0,1200,915);
  const running=['accelerating','spinning','decelerating','settling'].includes(s.stage);
  const intensity=Math.min(1,Math.abs(s.velocity)/8);
  if(o.particles===0)this.particles=[];
  if(!paused&&running&&o.particles>0){
   this.emission+=dt*o.particles*intensity;const n=Math.floor(this.emission);this.emission-=n;this.emit(n,o,s);
   this.burstClock+=dt*intensity;
   if(this.burstClock>.22){this.burstClock=0;this.emit(Math.ceil(o.particles*.09),o,s,true);}
  }
  if(s.stage==='complete'&&this.lastStage!=='complete'&&o.particles>0&&!paused)this.emit(Math.min(140,o.particles*1.2),o,s,true);
  this.lastStage=s.stage;
  f.save();f.globalCompositeOperation='lighter';f.lineCap='round';
  const step=paused?0:dt;
  for(const p of this.particles){
   p.life-=step;p.vy+=o.gravity*step;p.x+=p.vx*step;p.y+=p.vy*step;
   if(p.life<=0)continue;
   const alpha=Math.min(1,p.life/p.maxLife*1.6),radius=p.size*(.35+.65*alpha);
   f.globalAlpha=alpha;
   if(o.glow>0){
    const halo=f.createRadialGradient(p.x,p.y,0,p.x,p.y,radius*(3+o.glow*2));
    halo.addColorStop(0,'rgba(255,170,25,.55)');halo.addColorStop(.3,'rgba(255,85,0,.2)');halo.addColorStop(1,'rgba(255,40,0,0)');
    f.fillStyle=halo;f.beginPath();f.arc(p.x,p.y,radius*(3+o.glow*2),0,Math.PI*2);f.fill();
   }
   const tail=.035+(p.color*.025),tx=p.x-p.vx*tail,ty=p.y-p.vy*tail;
   const trail=f.createLinearGradient(tx,ty,p.x,p.y);trail.addColorStop(0,'rgba(255,60,0,0)');trail.addColorStop(.55,'#ff7900');trail.addColorStop(1,'#ffe68b');
   f.strokeStyle=trail;f.lineWidth=Math.max(.7,radius*.8);f.beginPath();f.moveTo(tx,ty);f.lineTo(p.x,p.y);f.stroke();
   f.fillStyle=p.color>.25?'#fff6c5':'#ffab24';f.beginPath();f.arc(p.x,p.y,radius*.65,0,Math.PI*2);f.fill();
  }
  this.particles=this.particles.filter(p=>p.life>0);f.globalAlpha=1;
  if(running&&o.glow>0&&o.particles>0){
   const pulse=.75+.25*Math.sin(s.time*43);
   for(const side of [-1,1] as const){
    const {x,y}=pointerPose(s,side,o.pointerShake);
    const g=f.createRadialGradient(x,y,0,x,y,25);
    g.addColorStop(0,`rgba(255,249,185,${o.glow*intensity*pulse})`);
    g.addColorStop(.15,`rgba(255,165,30,${o.glow*intensity*.7*pulse})`);
    g.addColorStop(.45,`rgba(255,65,0,${o.glow*intensity*.3})`);g.addColorStop(1,'rgba(255,50,0,0)');
    f.fillStyle=g;f.fillRect(x-25,y-25,50,50);
   }
  }f.restore();
 }
}
