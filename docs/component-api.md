# 炉石匹配实验室

经典炉石传说匹配界面的 React 交互复刻。TypeScript + React 19 + Vite；分层高清美术资源、Canvas 曲面滚筒和粒子、Web Audio 合成音效。

## 运行

需要 Node.js 22.18+（测试依赖原生 TypeScript 类型剥离；推荐 Node 24+）。

```sh
npm install
npm run dev -- --host 127.0.0.1 --port 5178
npm run typecheck
npm test
npm run build
```

## 组件复用

```tsx
import { useRef } from 'react';
import { Matchmaker, type MatchmakerHandle } from './matchmaker/Matchmaker';
import { defaultOptions } from './matchmaker/options';
import './matchmaker/matchmaker.css';

export function Demo() {
  const matcher = useRef<MatchmakerHandle>(null);
  return (
    <section style={{ width: 900 }}>
      <Matchmaker
        ref={matcher}
        options={defaultOptions}
        onComplete={opponent => console.log(opponent.name)}
        onCancel={() => console.log('cancelled')}
      />
      <button onClick={() => matcher.current?.start()}>开始匹配</button>
    </section>
  );
}
```

把 `src/matchmaker/` 和 `public/assets/` 复制到目标 React 项目。组件不依赖实验面板或图标库。静态素材默认位于 `/assets/`，部署在子路径时需统一调整素材 URL。`/assets/noto-serif-sc-bold.woff2` 为中文衬线字体。

### API

- `options: MatchOptions`：内容、时序、画面、粒子、音频。
- `onComplete(opponent)`：自然播放完成后触发一次。时间轴拖到终点只预览结果，不触发完成事件。
- `onCancel()`：取消运行时触发。
- `onTelemetry(sample)`：约每 100ms 报告时间、阶段、速度、FPS、粒子数量、音频状态。
- `ref.start()` / `cancel()` / `pause()` / `resume()` / `seek(seconds)`。
- `ref.loadSound(kind, file)` / `resetSounds()` / `previewSound(kind)`。
- `kind` 为 `start | tick | success | cancel | music`。

运动参数和名单在每次启动时固定；画面、播放倍率与混音参数即时生效。单个候选项、任意滚动方向、取消重开均可工作。使用固定随机种子可重现结果与粒子随机序列（粒子发射采样仍受实际帧率影响）。

### 实验面板

动画、画面、内容、声音四个标签页。滚筒支持加速、匀速、减速、阻尼回弹；结果可指定或按权重随机。暂停后可拖动时间轴观察。候选名单每行 `名称 | 权重`，权重省略时为 1。

配置自动保存在 localStorage，可导入/导出带版本号的 JSON。导入严格验证并限制数值范围；无效名单或非数值配置给出错误。上传的音频只保留在当前会话，不进入配置文件。

`?embed=1` 提供只有匹配器的展示页，可用于视觉对照。实验室页面使用响应式布局，小屏幕参数面板移到预览下方。

## 参考与素材

见 [references/sources.md](references/sources.md) 和 [references/asset-prompts.md](references/asset-prompts.md)。外壳与红色名牌是参考原版后生成的美术资源；背景为暴雪公开截图；默认音效和旋律为合成声音，并非游戏原始音轨。支持用户自行替换音频。

整体构图以官方 1920×1200 界面与用户截图的经典机械匹配器为准。滚筒文字和火花按 devicePixelRatio 绘制（上限 3）；材质资源为独立栅格图，当前外壳 1436×1095，不能声称为原生 4K 美术资源。

## 验证

`tests/engine.test.ts` 验证正反向精确停靠、阶段连续性、固定种子、单候选项和配置校验。浏览器验证和画面对照记录见 `design-qa.md`。
