# Design QA — 炉石匹配实验室

final result: passed

## Comparison target and evidence

- Source visual truth: `references/blizzard-matchmaking.png` (official Blizzard 1920×1200 screenshot), plus `references/mobile-matchmaking.png` (1124×632 high-speed state) and the user's 550×310 classic Chinese screenshot.
- Source normalized region: official panel x374–1574, y160–1075; 1200×915 pixels.
- Rendered implementation: `qa/component-final.png`, browser screenshot 1280×720. Component DOM box x167.90, y0.008, 944.20×719.98 CSS pixels, devicePixelRatio 2. The browser screenshot API normalizes its output to CSS pixels. Crop x168–1112, y0–720, resample to 1200×915 for like-size comparison.
- State: stationary spinner with selected center item. Reference uses Russian localization; implementation uses Chinese and an idle start button. Text and button behavior are intentionally editable and are not compared as verbatim Russian copy.
- Full-view combined comparison: `qa/comparison-final.png`. Earlier comparison: `qa/comparison.png`.
- Focused spool, shading and pointer comparison: `qa/detail-comparison-final.png`. Earlier comparison: `qa/detail-comparison.png`.
- Broader lab captures: `qa/mobile.png`, `qa/desktop-1920.png`, `qa/desktop-4k-current.png` (3840×2160). The initial 4K capture was stale after resizing and was superseded by the full-page current capture; the DOM size and the current full-page image agree. Native screenshot resizing can lag one capture during a viewport override; those intermediate captures are not used for fidelity judgment.
- Network grounding and asset provenance: `references/sources.md`, `references/asset-prompts.md`.

## Findings and comparison history

### Iteration 1 — fixed

- [P2] High-speed spool was too dark compared with the source. Layered blur was drawn over transparent canvas without a solid base. Fixed by drawing a solid spool first, blending motion trails, and adding speed-dependent illumination.
- [P2] Stationary nameplates were burgundy relative to the brighter vermilion reference. Fixed by brightening/saturating the real nameplate asset during row rasterization. Post-fix evidence: `qa/detail-comparison-final.png`.
- [P2] Tip copy was too small and formed a single long line. Increased its scale and introduced a two-line default layout. Post-fix evidence: `qa/comparison-final.png`.
- [P2] Numeric controls and native sliders could disagree for values such as 0.48 and 0.72 because of native step snapping. Range sliders now accept arbitrary finite values; number inputs retain useful stepping. Inspected current DOM values after the fix.
- [P2] Narrow-screen start button wrapped. Removed browser-default button padding, set nowrap, and allowed tip type to scale below 8px within the scaled game scene. Responsive controls outside the scene remain normal readable sizes.
- [P2] Paused/static high-resolution canvas continued rendering every frame. Cache opponent row images and redraw only when the sample, visual options, canvas revision or moving particles change. Texture and font loading invalidate the cache, as do resize and seek.

### Iteration 2 — passed

Opened both full-view and focused side-by-side comparisons after the fixes. The selected-row alignment, twin crossbars, inward yellow pointers, dark beveled surround, parchment plates, top nameplate and bottom button occupy the expected regions. There are no remaining blocking interaction or responsive-layout findings.

## Required fidelity surfaces

- **Fonts/typography:** locally hosted Noto Serif SC bold (SIL OFL), outlined light opponent text, dark parchment copy, mild cylindrical compression away from center. Chinese content replaces Russian source content. The lab UI uses system sans-serif. Exact proprietary in-game glyphs are not included.
- **Spacing/layout:** official panel aspect ratio preserved (generated sprite 1436×1095), window centered, selection between the two crossbars, title and parchment text live over blank asset plates. The experiment sidebar is additional app UI and can be hidden. 390px uses a vertically stacked panel without horizontal overflow.
- **Colors/tokens:** charcoal/brown metal, parchment ochre, yellow gold pointers and bars, vermilion spool. Corrected excessive darkness in both stationary and high-speed states. Lighting and glow remain tunable.
- **Image quality/assets:** real generated frame sprite and nameplate texture, official blurred background, live canvas type and particles. No screenshot is stretched to stand in for the entire interactive component. The frame has 1436×1095 native pixels; 4K refers to supported viewport/rendering, not a claim of native 4K frame art.
- **Copy/content:** Chinese classic title and user-provided tip meaning preserved, candidates editable with weights, local results clearly simulated in the About dialog. Default synthesized audio is labeled; replacement audio is session-only. Errors for empty/duplicate/invalid candidates and invalid JSON imports are visible.

## Browser interactions verified

- Start → acceleration → spinning → deceleration → rebound → completion; classic center result observed.
- Replay, cancel and restart; pause and resume; actual mouse drag on time axis reached 6.68s and changed to the deceleration sample. Native Home/End automation was inconsistent on macOS; no claim is made about that automation path.
- Reverse direction; 2× playback; single custom opponent; chosen imported result “实验二号”.
- Empty candidate error; valid candidate apply; invalid config rejection retaining existing settings; successful JSON import.
- Export downloaded `hearthstone-match-config.json`; readback confirmed version 1, title, chosen result, and two candidates. Evidence copied to `qa/exported-config.json`. The browser download event wait timed out even though the file was successfully saved; verified using the actual resulting file.
- Audio activation after click; mute/unmute; uploaded WAV decoded, file name shown, and preview action executed; restored default audio. Subjective fidelity to original recorded audio has not been claimed.
- Settings persisted across reload; restore default preset.
- 390×844: full-page screenshot 390×1373, no horizontal overflow; canvas at 354×270 pixels at DPR 1.
- 1920×1080: no horizontal overflow; component 1038.625×791.984 CSS pixels.
- 3840×2160: no horizontal overflow; component 1800×1372.56 CSS pixels; current full-page screenshot 3840×2160.
- Browser console: no error/warning messages captured from the app during tested interactions.

## Automated checks

- `npm run build`: TypeScript and production Vite build passed.
- `npm test`: four engine/config tests passed: exact landing in both directions from fractional starts; continuous monotonic phases before rebound; deterministic weighted selection and one candidate; invalid imports and bounded numeric values.

## Follow-up polish / precise limits

- [P3] Generated bevels, scratches, ornamental curves and nameplate texture are a close material reconstruction, not pixel-identical extraction of proprietary game artwork.
- [P3] Animation timing is a tunable simulation informed by visual references, not measured frame-for-frame from the original engine. Default audio is synthesized and replaceable.
- [P3] The native frame sprite is HD rather than native 4K. Text and particles render at device pixel ratio, capped at 3.

## Implementation checklist

- [x] Reference and prototype opened and compared together.
- [x] Full-view and focused comparisons after fixes.
- [x] Primary interactions, errors, audio controls and responsive layouts verified.
- [x] TypeScript/production build and meaningful engine checks passed.
- [x] Documentation includes reuse API, config behavior, sources and asset limits.
- [x] Local preview retained; no public deployment performed.

## 火花增强验证（2026-10-04）

- 将火花移到金属外壳之上的独立 Canvas，修复被不透明边框遮挡的问题。
- 增加亮芯、渐变拖尾、外扩辉光、随机喷溅、重力余烬和成功爆发；保持既有参数和暂停控制。
- 浏览器观察到 67 个可见粒子，暂停保持画面；发射数量设为 0 后清空粒子，恢复原值 65 后完整匹配成功。控制台无警告或错误。
- `npm run build` 和 4 项引擎测试通过。截图：`qa/particles-enhanced.png`。

## 指针与发射点复核（2026-10-04）

- 原版录像约 9 秒逐帧观察：火花亮芯靠近尖端下方，左右指针存在不同步的小幅摆动。
- 外壳改用 SVG 分层，独立指针绕螺钉旋转；共享几何函数计算箭头和火花源位置，火星以向外、向下为主。
- 新增指针抖动参数 0–8 度，默认 3 度；旧配置通过规范化补齐默认值。暂停时两侧角度保持 -2.207 度、-0.743 度，设为 0 后均回正，恢复 3 后重现相同姿态。
- 构建和 4 项既有测试通过，浏览器控制台无报错。截图：`qa/pointers-corrected.png`。拟合曲线并非原版源码参数。
