export interface Opponent { name: string; weight: number }
export interface MatchOptions {
  title: string; tip: string; opponents: Opponent[]; result: string; seed: number;
  acceleration: number; cruise: number; deceleration: number; settle: number;
  speed: number; direction: 1 | -1; rebound: number; bounces: number; playback: number;
  pointerShake: number; blur: number; glow: number; fontSize: number; scale: number; brightness: number;
  particles: number; particleSpeed: number; life: number; gravity: number; particleSize: number;
  volume: number; mechanicalVolume: number; successVolume: number; musicVolume: number; muted: boolean;
}
export const defaultOptions: MatchOptions = {
  title:'寻找对手', tip:'基本卡牌能够在某个职业升级时获得。\n经典卡牌来自于经典扩展包。',
  opponents:[{name:'你的老室友',weight:1},{name:'炉石传说高手',weight:1},{name:'一毛不拔的朋友',weight:1},{name:'旗鼓相当的对手',weight:1},{name:'暴雪开发者',weight:1},{name:'一只小奶狗',weight:1},{name:'传说中的菜鸟',weight:1},{name:'愤怒的小鸡',weight:1},{name:'星际争霸冠军',weight:1},{name:'旅店老板',weight:1},{name:'打牌很慢的人',weight:1},{name:'你最好的朋友',weight:1}],
  result:'旗鼓相当的对手',seed:42,acceleration:.85,cruise:5,deceleration:2.6,settle:1.1,speed:18,direction:1,rebound:.5,bounces:2,playback:1,
  pointerShake:3,blur:8,glow:.75,fontSize:29,scale:1,brightness:.48,particles:65,particleSpeed:120,life:.72,gravity:170,particleSize:2.3,
  volume:.55,mechanicalVolume:.7,successVolume:.85,musicVolume:.18,muted:false,
};
export const numericRanges: Partial<Record<keyof MatchOptions, [number, number]>> = {
 seed:[0,2147483647], acceleration:[.1,3], cruise:[.2,30], deceleration:[.2,8], settle:[.2,4], speed:[2,45], rebound:[0,1.5], bounces:[1,5], playback:[.1,2],
 pointerShake:[0,8],blur:[0,18], glow:[0,2], fontSize:[18,40],scale:[.6,1.2],brightness:[.1,1],particles:[0,200],particleSpeed:[30,250],life:[.1,2],gravity:[0,400],particleSize:[.5,5],volume:[0,1],mechanicalVolume:[0,1],successVolume:[0,1],musicVolume:[0,1],
};
export function normalizeOptions(input: unknown): MatchOptions {
 if(!input || typeof input!=='object' || Array.isArray(input)) throw new Error('配置必须是 JSON 对象');
 const x=input as Record<string,unknown>; const out={...defaultOptions, opponents:defaultOptions.opponents.map(i=>({...i}))};
 for(const [key,range] of Object.entries(numericRanges)) {
  if(key in x) { if(typeof x[key]!=='number'|| !Number.isFinite(x[key])) throw new Error(`${key} 必须是有限数值`); (out as unknown as Record<string,unknown>)[key]=Math.max(range![0],Math.min(range![1],x[key] as number)); }
 }
 out.seed=Math.round(out.seed);out.bounces=Math.round(out.bounces);
 for(const key of ['title','tip','result'] as const) if(key in x) {if(typeof x[key]!=='string') throw new Error(`${key} 必须是文字`);out[key]=(x[key] as string).slice(0,key==='tip'?160:40);}
 if('direction' in x) out.direction=x.direction===-1?-1:1;
 if('muted' in x) {if(typeof x.muted!=='boolean') throw new Error('muted 必须是布尔值'); out.muted=x.muted;}
 if('opponents' in x) {
  if(!Array.isArray(x.opponents)||x.opponents.length===0||x.opponents.length>100) throw new Error('候选名单需包含 1–100 项');
  out.opponents=x.opponents.map((i:unknown)=>{if(!i||typeof i!=='object')throw new Error('候选项格式错误'); const a=i as Record<string,unknown>;if(typeof a.name!=='string'||!a.name.trim()||typeof a.weight!=='number'|| !Number.isFinite(a.weight)||a.weight<=0)throw new Error('候选名称不能为空，权重必须大于 0');return {name:a.name.trim().slice(0,40),weight:Math.min(a.weight,10000)};});
  if(new Set(out.opponents.map(i=>i.name)).size!==out.opponents.length)throw new Error('候选名称不能重复');
 }
 if(out.result && !out.opponents.some(i=>i.name===out.result)) out.result='';
 return out;
}
export const stageNames = {idle:'准备就绪',accelerating:'启动加速',spinning:'寻找对手',decelerating:'减速停靠',settling:'回弹校准',complete:'匹配成功',cancelled:'已取消'};
