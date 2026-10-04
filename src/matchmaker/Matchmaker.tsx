import {useEffect,useId,useImperativeHandle,useRef,useState} from 'react';import type {CSSProperties,Ref} from 'react';
import type {MatchOptions,Opponent} from './options.ts';import {createPlan,samplePlan,wrap} from './engine.ts';import type {Plan,Sample,Stage} from './engine.ts';import {MatchAudio} from './audio.ts';import type {SoundKind} from './audio.ts';import {MatchRenderer} from './renderer.ts';import './matchmaker.css';import {pointerPose} from './pointers.ts';
export interface Telemetry extends Sample {fps:number;duration:number;paused:boolean;winner:string;particles:number;audio:string}
export interface MatchmakerHandle {start:()=>Promise<void>;cancel:()=>void;pause:()=>void;resume:()=>Promise<void>;seek:(seconds:number)=>void;loadSound:(kind:SoundKind,file:File)=>Promise<void>;resetSounds:()=>void;previewSound:(kind:SoundKind)=>Promise<void>}
export interface MatchmakerProps {options:MatchOptions;ref?:Ref<MatchmakerHandle>;onComplete?:(opponent:Opponent)=>void;onCancel?:()=>void;onTelemetry?:(sample:Telemetry)=>void}
export function Matchmaker({options,ref,onComplete,onCancel,onTelemetry}:MatchmakerProps){
 const artId=useId().replace(/:/g,'');const leftPointer=useRef<SVGGElement>(null),rightPointer=useRef<SVGGElement>(null);
 const root=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null),effects=useRef<HTMLCanvasElement>(null);const renderer=useRef<MatchRenderer|null>(null),audio=useRef<MatchAudio|null>(null);const live=useRef(options);live.current=options;
 const callbacks=useRef({onComplete,onCancel,onTelemetry});callbacks.current={onComplete,onCancel,onTelemetry};
 const run=useRef<{plan:Plan|null;time:number;paused:boolean;stage:Stage;offset:number;completed:boolean}>({plan:null,time:0,paused:false,stage:'idle',offset:3,completed:false});
 const [stage,setStage]=useState<Stage>('idle');const [result,setResult]=useState('');const [paused,setPaused]=useState(false);const [audioError,setAudioError]=useState('');
 function publishStage(s:Stage){run.current.stage=s;setStage(s);}
 async function start(){const r=run.current;audio.current?.stop();let error='';try{await audio.current?.unlock();}catch{error='声音未启用';}setAudioError(error);
  const plan=createPlan(live.current,r.offset);run.current={plan,time:0,paused:false,stage:'accelerating',offset:r.offset,completed:false};renderer.current?.reset(live.current.seed);setPaused(false);setResult('');publishStage('accelerating');if(!error)audio.current?.start();
 }
 function cancel(){if(!run.current.plan||run.current.stage==='complete'||run.current.stage==='cancelled')return;audio.current?.stop();audio.current?.play('cancel');run.current.plan=null;run.current.paused=false;setPaused(false);publishStage('cancelled');callbacks.current.onCancel?.();}
 function pause(){if(!run.current.plan||['complete','cancelled'].includes(run.current.stage))return;run.current.paused=true;setPaused(true);audio.current?.stop();}
 async function resume(){if(!run.current.plan||!run.current.paused||run.current.time>=run.current.plan.duration)return;try{await audio.current?.unlock();audio.current?.start(true);}catch{setAudioError('声音未启用');}run.current.paused=false;setPaused(false);}
 function seek(seconds:number){const r=run.current;if(!r.plan)return;r.time=Math.max(0,Math.min(seconds,r.plan.duration));r.paused=true;r.completed=false;audio.current?.stop();renderer.current?.reset(live.current.seed);setPaused(true);const s=samplePlan(r.plan,r.time);r.offset=s.offset;publishStage(s.stage);setResult(s.stage==='complete'?r.plan.winner.name:'');}
 useImperativeHandle(ref,()=>({start,cancel,pause,resume,seek,loadSound:async(kind,file)=>{if(!audio.current)throw new Error('声音引擎未就绪');await audio.current.load(kind,file);},resetSounds:()=>audio.current?.resetSamples(),previewSound:async kind=>{await audio.current?.unlock();audio.current?.play(kind);}}));
 useEffect(()=>{const art=new MatchRenderer(canvas.current!,effects.current!);const sound=new MatchAudio(live.current);const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;renderer.current=art;audio.current=sound;
  const observer=new ResizeObserver(entries=>{const b=entries[0].contentRect;art.resize(b.width,b.height);});observer.observe(root.current!);
  let frame=0,last=performance.now(),lastNotify=0,frames=0,lastFps=last,fps=60,lastDrawing='';
  function loop(now:number){const dt=Math.min((now-last)/1000,.1);last=now;frames++;if(now-lastFps>500){fps=Math.round(frames*1000/(now-lastFps));frames=0;lastFps=now;}
   const r=run.current,o=live.current;let s:Sample={time:0,offset:r.offset,velocity:0,stage:r.stage,progress:0};
   if(r.plan){if(!r.paused&&r.stage!=='complete')r.time=Math.min(r.plan.duration,r.time+dt*o.playback);s=samplePlan(r.plan,r.time);r.offset=s.offset;if(s.stage!==r.stage)publishStage(s.stage);
    if(!r.paused&&!r.completed){sound.update(s.offset,s.velocity,s.time);if(s.stage==='complete'){r.completed=true;sound.stop();sound.play('success');setResult(r.plan.winner.name);callbacks.current.onComplete?.(r.plan.winner);}}
   }
   const drawKey=`${s.offset.toFixed(6)}:${s.velocity.toFixed(4)}:${s.stage}:${r.paused}:${art.revision}:${JSON.stringify(o)}`;
   if(drawKey!==lastDrawing||(!r.paused&&art.particles.length>0)){art.render(s,reducedMotion?{...o,pointerShake:0}:o,r.plan?.options.opponents??o.opponents,r.paused,dt*o.playback);
    for(const [side,node] of [[-1,leftPointer.current],[1,rightPointer.current]] as const){const p=pointerPose(s,side,reducedMotion?0:o.pointerShake);node?.setAttribute('transform',`rotate(${p.angle} ${p.pivot.x} ${p.pivot.y})`);}lastDrawing=drawKey;}sound.configure(o);
   if(now-lastNotify>100){lastNotify=now;callbacks.current.onTelemetry?.({...s,fps,duration:r.plan?.duration??o.acceleration+o.cruise+o.deceleration+o.settle,paused:r.paused,winner:r.plan?.winner.name??'',particles:art.particles.length,audio:sound.ctx?.state??'未激活'});}
   frame=requestAnimationFrame(loop);
  }frame=requestAnimationFrame(loop);return()=>{cancelAnimationFrame(frame);observer.disconnect();sound.dispose();renderer.current=null;audio.current=null;};
 },[]);
 const active=['accelerating','spinning','decelerating','settling'].includes(stage);
 return <div className={`matchmaker ${stage==='complete'?'is-complete':''}`} ref={root} style={{'--font-factor':options.fontSize/29} as CSSProperties} data-stage={stage} data-paused={paused}>
  <canvas className="match-canvas" ref={canvas} aria-hidden="true"/>
  <svg className="frame-art" viewBox="0 0 1436 1095" aria-hidden="true">
   <defs>
    <path id={`${artId}-left`} d="M395 400 Q399 397 405 404 L539 482 Q553 495 540 504 L385 553 Q374 558 378 545 L393 495 Z"/>
    <path id={`${artId}-right`} d="M1068 405 Q1060 400 1055 407 L915 482 Q900 496 915 504 L1073 557 Q1082 562 1079 548 L1064 495 Z"/>
    <clipPath id={`${artId}-clip-left`}><use href={`#${artId}-left`}/></clipPath>
    <clipPath id={`${artId}-clip-right`}><use href={`#${artId}-right`}/></clipPath>
    <mask id={`${artId}-shell`} maskUnits="userSpaceOnUse" x="0" y="0" width="1436" height="1095"><rect width="1436" height="1095" fill="white"/><use href={`#${artId}-left`} fill="black"/><use href={`#${artId}-right`} fill="black"/></mask>
    <linearGradient id={`${artId}-metal`} x2="0" y2="1"><stop stopColor="#4e463a"/><stop offset="1" stopColor="#292720"/></linearGradient>
   </defs>
   <use href={`#${artId}-left`} fill={`url(#${artId}-metal)`}/><use href={`#${artId}-right`} fill={`url(#${artId}-metal)`}/>
   <image href="/assets/match-frame.png" width="1436" height="1095" mask={`url(#${artId}-shell)`}/>
   <g ref={leftPointer} className="pointer-left"><image href="/assets/match-frame.png" width="1436" height="1095" clipPath={`url(#${artId}-clip-left)`}/></g>
   <g ref={rightPointer} className="pointer-right"><image href="/assets/match-frame.png" width="1436" height="1095" clipPath={`url(#${artId}-clip-right)`}/></g>
  </svg>
  <canvas className="match-effects" ref={effects} aria-hidden="true"/>
  <div className="match-title">{options.title}</div>
  <div className="match-tip">{options.tip}</div>
  <button className="match-button" onClick={()=>active?cancel():void start()} aria-label={active?'取消匹配':'开始匹配'}>{active?'取消':'开始匹配'}</button>
  <div className="queue-time" hidden={!active}><span>预计时间</span><strong>约 {Math.round((options.acceleration+options.cruise+options.deceleration+options.settle)/options.playback)} 秒</strong><span>已用时间</span><QueueTimer timeRef={run}/></div>
  <div className="sr-only" role="status" aria-live="polite">{stage==='complete'?`匹配成功：${result}`:stage==='cancelled'?'已取消匹配':paused?'动画已暂停':active?'正在寻找对手':'准备开始匹配'}{audioError}</div>
 </div>;
}
function QueueTimer({timeRef}:{timeRef:React.RefObject<{time:number}>}){const [time,setTime]=useState(0);useEffect(()=>{const id=setInterval(()=>setTime(Math.floor(timeRef.current.time)),250);return()=>clearInterval(id);},[timeRef]);return <strong>{time} 秒</strong>;}
