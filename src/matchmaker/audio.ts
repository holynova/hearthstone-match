import type {MatchOptions} from './options.ts';
export type SoundKind='start'|'tick'|'success'|'cancel'|'music';
export class MatchAudio {
 ctx:AudioContext|null=null; master:GainNode|null=null; loop:AudioBufferSourceNode|null=null; loopGain:GainNode|null=null; musicGain:GainNode|null=null;
 noise:AudioBuffer|null=null; lastTick=-1; lastMusic=0; options:MatchOptions; samples=new Map<SoundKind,AudioBuffer>(); active=new Set<AudioScheduledSourceNode>();
 constructor(options:MatchOptions){this.options=options;}
 async unlock(){if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.connect(this.ctx.destination); const b=this.ctx.createBuffer(1,this.ctx.sampleRate*.7,this.ctx.sampleRate);const a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;this.noise=b;}if(this.ctx.state==='suspended')await this.ctx.resume();this.configure(this.options);}
 configure(o:MatchOptions){this.options=o;if(this.ctx&&this.musicGain)this.musicGain.gain.setTargetAtTime(o.musicVolume,this.ctx.currentTime,.03);if(this.ctx&&this.master)this.master.gain.setTargetAtTime(o.muted?0:o.volume,this.ctx.currentTime,.03);}
 track(n:AudioScheduledSourceNode,...nodes:AudioNode[]){this.active.add(n);n.onended=()=>{this.active.delete(n);n.disconnect();nodes.forEach(node=>node.disconnect());};}
 tone(freq:number,duration:number,volume:number,delay=0,type:OscillatorType='triangle'){
  const c=this.ctx;if(!c||!this.master)return;const n=c.createOscillator(),g=c.createGain(),t=c.currentTime+delay;n.type=type;n.frequency.setValueAtTime(freq,t);n.frequency.exponentialRampToValueAtTime(Math.max(20,freq*.98),t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0001,volume),t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);n.connect(g);g.connect(this.master);this.track(n,g);n.start(t);n.stop(t+duration+.02);
 }
 noiseHit(duration:number,volume:number,freq:number){const c=this.ctx;if(!c||!this.master||!this.noise)return;const n=c.createBufferSource(),g=c.createGain(),f=c.createBiquadFilter();n.buffer=this.noise;f.type='bandpass';f.frequency.value=freq;f.Q.value=.7;g.gain.setValueAtTime(Math.max(.0001,volume),c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);n.connect(f);f.connect(g);g.connect(this.master);this.track(n,f,g);n.start();n.stop(c.currentTime+duration);}
 play(kind:SoundKind){const c=this.ctx;if(!c||!this.master)return; const volume=kind==='success'?this.options.successVolume:kind==='music'?this.options.musicVolume:this.options.mechanicalVolume;
 const buffer=this.samples.get(kind);if(buffer){const n=c.createBufferSource(),g=c.createGain();n.buffer=buffer;g.gain.value=volume;n.connect(g);g.connect(this.master);this.track(n,g);n.start();return;}
 if(kind==='start'){this.noiseHit(.35,.25*volume,340);this.tone(90,.35,.3*volume);this.tone(220,.18,.15*volume,.08);}
 if(kind==='tick'){this.noiseHit(.028,.15*volume,2200);this.tone(690,.055,.1*volume);this.tone(1210,.035,.025*volume);}
 if(kind==='cancel'){this.tone(165,.15,.14*volume);this.noiseHit(.12,.18*volume,600);}
 if(kind==='success'){this.noiseHit(.2,.22*volume,900);[261.63,329.63,392,523.25].forEach((f,i)=>{this.tone(f,1.8,.12*volume,i*.09);this.tone(f*2,1.1,.025*volume,i*.09,'sine');});}
 }
 start(resuming=false){this.stop();this.lastTick=-1;this.lastMusic=0;if(!resuming)this.play('start');const c=this.ctx;if(!c||!this.master||!this.noise)return;
 const n=c.createBufferSource(),g=c.createGain(),f=c.createBiquadFilter();n.buffer=this.noise;n.loop=true;f.type='lowpass';f.frequency.value=450;g.gain.value=0;n.connect(f);f.connect(g);g.connect(this.master);this.track(n,f,g);n.start();this.loop=n;this.loopGain=g;
 if(this.samples.has('music')){const m=c.createBufferSource(),mg=c.createGain();m.buffer=this.samples.get('music')!;m.loop=true;mg.gain.value=this.options.musicVolume;m.connect(mg);mg.connect(this.master);this.musicGain=mg;this.track(m,mg);m.start();}
 }
 update(offset:number,velocity:number,time:number){const c=this.ctx;if(!c)return;const v=Math.abs(velocity);if(this.loopGain)this.loopGain.gain.setTargetAtTime(Math.min(1,v/18)*.08*this.options.mechanicalVolume,c.currentTime,.03);if(this.loop)this.loop.playbackRate.setTargetAtTime(.55+Math.min(v,40)/30,c.currentTime,.03);
 const cell=Math.floor(offset);if(cell!==this.lastTick&&v>.2&&c.currentTime-this.lastMusic>.038){this.play('tick');this.lastTick=cell;this.lastMusic=c.currentTime;}
 // Quiet synthesized plucked accompaniment; optional user-provided music replaces it.
 if(!this.samples.has('music')&&this.options.musicVolume>0&&Math.floor(time*2)!==this.musicStep){this.musicStep=Math.floor(time*2);const notes=[196,246.94,293.66,246.94,220,261.63,329.63,261.63];this.tone(notes[this.musicStep%8],.42,this.options.musicVolume*.12);}
 }
 musicStep=-1;
 async load(kind:SoundKind,file:File){await this.unlock();const buffer=await this.ctx!.decodeAudioData(await file.arrayBuffer());this.samples.set(kind,buffer);}
 resetSamples(){this.samples.clear();}
 stop(){for(const n of this.active){try{n.stop();}catch{/* already ended */}}this.active.clear();this.loop=null;this.loopGain=null;this.musicGain=null;this.musicStep=-1;}
 dispose(){this.stop();void this.ctx?.close();this.ctx=null;}
}
