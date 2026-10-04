import type { MatchOptions, Opponent } from './options.ts';
export type Stage = 'idle'|'accelerating'|'spinning'|'decelerating'|'settling'|'complete'|'cancelled';
export interface Sample { time: number; offset: number; velocity: number; stage: Stage; progress: number }
export interface Plan {options:MatchOptions;duration:number;speed:number;distance:number;target:number;winner:Opponent;start:number}
export function seededRandom(seed:number) {let s=seed>>>0;return ()=>{s=(s+0x6D2B79F5)>>>0;let t=Math.imul(s^(s>>>15),1|s);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};}
export function wrap(n:number,len:number) {return ((n%len)+len)%len;}
export function createPlan(options:MatchOptions,start=0):Plan {
 if(!options.opponents.length)throw new Error('候选名单不能为空');
 const o={...options,opponents:options.opponents.map(i=>({...i}))}; const rng=seededRandom(o.seed);
 let target=o.opponents.findIndex(i=>i.name===o.result);
 if(target<0){let n=rng()*o.opponents.reduce((s,i)=>s+i.weight,0);target=o.opponents.findIndex(i=>(n-=i.weight)<0); if(target<0)target=o.opponents.length-1;}
 const integral=o.acceleration/2+o.cruise+o.deceleration/3;
 const nominal=o.speed*integral; const base=start+o.direction*nominal;
 // Choose a congruent endpoint ahead of the start; adjust speed so the curve lands exactly.
 let endpoint=target+Math.round((base-target)/o.opponents.length)*o.opponents.length;
 if(o.direction*(endpoint-start)<=0)endpoint+=o.direction*o.opponents.length;
 const distance=Math.abs(endpoint-start);const speed=distance/integral;
 return {options:o,duration:Math.round((o.acceleration+o.cruise+o.deceleration+o.settle)*10000)/10000,speed,distance,target,winner:o.opponents[target],start};
}
export function samplePlan(p:Plan,t:number):Sample {
 const o=p.options; const time=Math.max(0,Math.min(t,p.duration)); const a=o.acceleration,b=a+o.cruise,c=b+o.deceleration;
 let distance=0,velocity=0,stage:Stage;
 if(time<a){const u=time/a;distance=p.speed*a*u*u/2;velocity=p.speed*u;stage='accelerating';}
 else if(time<b){distance=p.speed*(a/2+time-a);velocity=p.speed;stage='spinning';}
 else if(time<c){const u=(time-b)/o.deceleration;distance=p.speed*(a/2+o.cruise+o.deceleration*(u-u*u+u*u*u/3));velocity=p.speed*(1-u)**2;stage='decelerating';}
 else if(time<p.duration){const u=(time-c)/o.settle;const k=2*Math.PI*o.bounces;distance=p.distance+o.rebound*Math.sin(k*u)*(1-u)**3;velocity=o.rebound/o.settle*(k*Math.cos(k*u)*(1-u)**3-3*Math.sin(k*u)*(1-u)**2);stage='settling';}
 else {distance=p.distance;stage='complete';}
 return {time,offset:p.start+o.direction*distance,velocity:velocity===0?0:o.direction*velocity,stage,progress:time/p.duration};
}
