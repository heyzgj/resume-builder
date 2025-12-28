# Debug Log

这份文档用来记录“值得留档”的 debug：复现方式、根因、修复方案、影响范围与后续建议。目标是让后来的开发者/agent 能快速理解问题并延续记录，而不是堆积长篇聊天或完整日志。

## 如何写入（约定）

- **新记录放在最上面**（倒序），便于最近问题优先被看到。
- **每条尽量短**：优先写结论与关键线索；长日志不要粘贴进来，改为概述 + 关键路径/命令。
- **必备字段**（建议都写）：
  - `日期`：`YYYY-MM-DD`
  - `问题`：一句话描述
  - `现象/复现`：最短可复现步骤
  - `根因`：一句话到两句话
  - `修复`：做了什么（包含关键文件路径）
  - `验证`：跑了什么/看到什么（命令 + 结果一句话）
  - `后续`（可选）：仍然存在的风险点、可改进项
- **不要**在这里写“最终代码贴一大段”。用文件路径定位即可。

---

## 记录

### 2025-12-28 — Editor 改了 Preview 不实时更新

- **问题**：左侧编辑器内容变更后，右侧 Preview 有时不刷新（直到触发重新分页/切换设置才更新）。
- **现象/复现**：修改某段描述文本/字段，Preview 保持旧内容；但切换一次布局/触发分页计算后又会刷新。
- **根因**：
  - Preview 的分页结果曾以 `ResumeBlock[][]`（包含 ReactNode）形式存入 state，并通过“只比较 block id”的 `blocksEqual()` 来跳过 `setPages`。
  - 当内容变化但 block id 不变时，state 里缓存的旧 ReactNode 会被继续渲染，导致看起来“不更新”。
- **修复**：
  - 将分页 state 改为 `string[][]`（block id 列表），渲染时通过 `blocksById` 映射到最新的 block.element，确保内容变化必然反映到 UI。
  - 关键改动：`components/preview/ResumePreview.tsx`。
- **验证**：`npm run build` 通过；编辑内容后 Preview 立即更新。

### 2025-12-28 — PDF 导出不跟随智能排版/密度设置

- **问题**：开启 Smart Fit / 调整密度后，导出的 PDF 仍然是默认版式（边距/行距不变）。
- **现象/复现**：在编辑页切换“智能排版/密度”，点击“下载 PDF”，导出效果无变化。
- **根因**：
  - 客户端请求 `/api/generate-pdf` 时未传入 `settings`，服务端只能用固定默认样式生成 PDF。
- **修复**：
  - 客户端导出请求加入 `settings`：`app/editor/[id]/page.tsx`、`app/dashboard/page.tsx`。
  - 服务端根据 `settings` 计算 `getTypography()` 并将 `marginX/marginY/lineHeight` 等写入 PDF 生成参数：`app/api/generate-pdf/route.ts`。
- **验证**：`npm run build` 通过；导出应随 `density/smartFitEnabled/layoutMode` 改变边距/行距（目前为“高层镜像”，非测量驱动的 100% fit）。

### 2025-12-28 — Preview 分页条遮挡内容/边距错误

- **问题**：简历超过 1 页时，分页条附近内容几乎贴边且被遮住，看起来像分页条“吃掉”文本。
- **现象/复现**：在编辑器右侧 Preview 中让内容溢出到 2+ 页，观察分页条上下区域（分页条覆盖内容、边距不符合 A4 预期）。
- **根因**：
  - 原实现的分页条是 `absolute` overlay，不参与布局，且自身高度/负 margin（`h-8` + `-mt-4`）会直接压在内容上。
  - 预览是单个连续容器，`padding`（页边距）只应用一次，没有“每页重复的 top/bottom 边距”，因此无法得到 Google Docs 那种分页滚动体验。
- **修复**：
  - 将 Preview 改为“真分页”渲染：先在隐藏测量层把内容拆成块并测高，再按 A4 页面可用高度装箱分配到多页容器；分页指示条渲染在页与页之间，不再覆盖内容。
  - 关键改动：`components/preview/ResumePreview.tsx`、`app/editor/[id]/page.tsx`。
- **验证**：
  - `npm run build` 通过。
  - `npm run lint` 当前仓库存在既有 eslint 报错（与本次改动无关），因此未作为阻断验证信号。
- **后续**（可选）：
  - `smart-fit` 的高度基准目前使用 Letter（1056px）而预览/导出按 A4（297mm），建议后续统一 page size 逻辑并使用 `settings.paperSize`。
