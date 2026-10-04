import type {Sample} from './engine.ts';

// Approximation observed from the classic spinner footage, in source-art coordinates.
export function pointerPose(s:Sample,side:-1|1,amplitude=3){
 const active=['accelerating','spinning','decelerating','settling'].includes(s.stage);
 const strength=active?Math.min(1,Math.abs(s.velocity)/10):0;
 const phase=s.offset*Math.PI*2+(side===1?1.7:0);
 const angle=amplitude*strength*(Math.sin(phase)*.65+Math.sin(s.time*57+side)*.25+Math.sin(s.time*91+side*2)*.1);
 const pivot=side===-1?{x:370,y:474}:{x:1087,y:476};
 const tip=side===-1?{x:540,y:497}:{x:913,y:497};
 const r=angle*Math.PI/180,dx=tip.x-pivot.x,dy=tip.y-pivot.y;
 return {angle,pivot,x:(pivot.x+dx*Math.cos(r)-dy*Math.sin(r))*1200/1436,
  y:(pivot.y+dx*Math.sin(r)+dy*Math.cos(r))*915/1095+14};
}
