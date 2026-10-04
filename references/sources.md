# 参考证据与边界

研究日期：2026-10-04。

1. 暴雪官方本地化文章（2014-08-28）：https://hearthstone.blizzard.com/ru-ru/news/15019545
   - 官方资源：https://bnetcmsus-a.akamaihd.net/cms/gallery/5YR9FVU42VM51407254433867.png
   - 本地 `blizzard-matchmaking.png`，1920×1200。已打开检查完整画面、文字透视、机械框体及黄色指针。文章本身讨论本地化，并非技术实现说明。
2. 经典机械匹配动画录像（2016-02-28）：https://www.youtube.com/watch?v=deTunPCWtD0
   - 已在 Codex 内置浏览器打开并播放，看到高速红色滚筒、两侧火花及匹配界面。未提取原版声音，未完成逐帧精确时序测量；实现使用可调模拟时间轴。
3. Hearthstone UI 移动界面展示：https://www.behance.net/gallery/25695693/Hearthstone-UI
   - 图像：https://mir-s3-cdn-cf.behance.net/project_modules/max_632_webp/28782125695693.5634954c1953d.png
   - 本地 `mobile-matchmaking.png`，1124×632。用于高速状态、两条金色跨栏、火花发射位置与底部返回键的交叉参考。展示来源不保证适用于所有游戏版本。
4. Finding Opponent 资料：https://hearthstone.fandom.com/wiki/Finding_Opponent
   - 搜索摘要说明减速后摇摆停稳、提示文案、取消按钮和匹配音乐。页面直连受限，仅用于辅助描述，不作为精确时序或资产来源。
5. 用户附图：550×310，作为经典中文版构图和文案参考。其低分辨率不作为最终背景图。
6. React 官方组件 ref 文档：https://react.dev/reference/react/useImperativeHandle
7. Google Noto Serif SC 字体：https://github.com/google/fonts/tree/main/ofl/notoserifsc
   - 字体为 SIL Open Font License，许可证保存在 public/assets/OFL.txt。

这是网页界面模拟器。界面素材、声音与模拟匹配不代表暴雪官方功能或真实匹配服务。

2026-10-04 指针运动复核：重新打开上述经典录像，在约 9 秒的高速阶段暂停，并用播放器逐帧前进，观察到尖端上下位置变化、左右不同步；火花亮芯位于尖端下方附近，外散余烬主要向下。网页采用绕螺钉的低幅旋转拟合，默认最大 3 度；没有获得原版源码或精确运动曲线。
