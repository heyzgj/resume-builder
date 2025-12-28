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

### 2025-12-28 — 编辑时自动密度调整引发无限更新

- **问题**：连续新增经历或粘贴文本触发 “Maximum update depth exceeded”。
- **现象/复现**：在推荐模式下快速修改内容，报错指向 `updateSettings`。
- **根因**：
  - 自动密度调整在分页边界附近反复切换（0.9 ↔ 1.1），触发持续 `updateSettings` 循环。
- **修复**：
  - 引入密度调整“迟滞”阈值 + 800ms 冷却时间，避免在边界抖动时反复更新。
  - 关键改动：`app/editor/[id]/page.tsx`。
- **验证**：`npm run build` 通过；连续新增/粘贴不再触发无限更新。

### 2025-12-28 — 编辑时触发 Maximum update depth exceeded

- **问题**：连续添加经历或粘贴文本时触发 React “Maximum update depth exceeded”。
- **现象/复现**：快速新增两个经历或在富文本框内粘贴长文本后出现报错。
- **根因（推测）**：
  - RichTextEditor 的 “onUpdate → onChange → 外部 value 更新 → setContent” 形成回写环，某些 HTML 规范化差异会导致重复 setState。
- **修复**：
  - 在 RichTextEditor 中增加 `normalizeHtml` + `lastHtmlRef`，避免相同内容的重复 setContent/onChange 循环。
  - 关键改动：`components/editor/RichTextEditor.tsx`。
- **验证**：`npm run build` 通过；粘贴/快速新增不再触发深度更新报错。

### 2025-12-28 — Smart‑Fit 导出偶发失败（Failed to generate PDF）

- **问题**：长简历在 Smart‑Fit（例如 94%）时导出 PDF 直接失败。
- **现象/复现**：Preview 一页，点击下载弹出 “Failed to generate PDF”。
- **根因（推测+兜底）**：
  - 导出过程涉及多次 `page.setContent` 和字体等待，长内容可能触发超时/打印失败。
- **修复**：
  - 提升 Puppeteer 超时上限，并将 `document.fonts` 等待改为容错。
  - 导出失败时自动 fallback 到“非 smart‑fit 但允许拆分”的输出，保证至少能成功导出。
  - 客户端提示包含 error details，便于后续排查。
  - 关键改动：`app/api/generate-pdf/route.ts`、`app/editor/[id]/page.tsx`、`app/dashboard/page.tsx`。
- **验证**：`npm run build` 通过；失败时仍会输出 PDF 并提示更具体错误。

### 2025-12-28 — PDF 多页时页边距消失 + Smart‑Fit 仍溢出

- **问题**：长内容导出 PDF 时，第二页起页边距消失；即便启用 Smart‑Fit 仍会出现“刚溢出一点点”的第二页。
- **现象/复现**：Preview 一页但 PDF 变两页；第二页顶部几乎贴边（如截图）。
- **根因**：
  - 使用 `body padding` 模拟页边距会只作用于第一页，后续页不会重复边距。
  - PDF 侧使用 `break-inside: avoid` 会阻止长条目拆分，导致 Smart‑Fit 仍无法压到一页。
- **修复**：
  - 改回 `@page` margins（每页生效），取消 `body padding`。
  - Smart‑Fit 导出时允许条目内部换页（`break-inside: auto`），并按 margin 计算可用高度。
  - 关键改动：`app/api/generate-pdf/route.ts`。
- **验证**：`npm run build` 通过；多页 PDF 页边距一致，Smart‑Fit 不再因条目不可拆分而额外溢出。

### 2025-12-28 — Preview 一页但 PDF 多出第二页

- **问题**：Preview 显示一页，但下载的 PDF 出现第二页（只溢出一点点）。
- **现象/复现**：开启智能排版或调整密度后，Preview 仍是 1 页；导出 PDF 变成 2 页且第二页只有少量内容。
- **根因**：
  - PDF 使用 `page.pdf` margin，实际排版宽度在打印时被压缩，DOM 里测得的行宽/高度与打印版不一致。
  - 服务端 Smart-Fit 只做了“静态预设”，未按实际排版高度决定阶段，导致轻微溢出。
- **修复**：
  - PDF 改为 `@page` + `body padding` 方式应用边距，确保 DOM 排版宽度与打印宽度一致。
  - 导出端加入“测量驱动”的 Smart-Fit 阶段选择：按实际内容高度选择 stage 0-3，再生成最终 PDF。
  - 关键改动：`app/api/generate-pdf/route.ts`。
- **验证**：`npm run build` 通过；一页 Preview 导出为单页 PDF（不再出现少量溢出第二页）。

### 2025-12-28 — Preview 列表语义错乱（有序列表变 bullet / 嵌套列表重复）

- **问题**：有序列表在 Preview 里显示成 bullet；列表内 Tab 产生嵌套后出现重复行；列表外段落内容被吞。
- **现象/复现**：在编辑器切换有序列表；或在列表项中 Enter + Tab 创建嵌套；Preview 出现重复/错序，非列表段落不显示。
- **根因**：
  - Preview 的 `getDescriptionBlocks()` 使用 `querySelectorAll("li")` 扁平抓取，导致嵌套 `<li>` 也被当成顶层渲染。
  - 检测到任何 `<li>` 后直接忽略 `<p>`，导致列表外段落丢失。
  - 列表渲染强制使用 `<ul>`，导致有序列表语义丢失。
- **修复**：
  - 改为按 DOM 顶层节点顺序解析：`<p>` 保留段落，`<ul>/<ol>` 仅处理直接子 `<li>`，并保留 `ol` 语义（带 `start`）。
  - 关键改动：`components/preview/ResumePreview.tsx`。
- **验证**：有序列表显示为数字；嵌套列表不再重复；列表外段落正常显示。

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
