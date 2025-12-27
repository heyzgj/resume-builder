# Resume Builder — Design System

## Brand Essence

**"有温度的极简"** — Warmth in Minimalism

A focused, premium editing experience inspired by Notion and Linear.

---

## Color Tokens

### Backgrounds
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-warm` | `#faf9f7` | 主背景 |
| `--bg-warm-subtle` | `#f5f4f1` | 卡片内嵌套区域 |
| `--card-surface` | `#ffffff` | 卡片表面 |

### Accent
| Token | Value | Usage |
|-------|-------|-------|
| `--accent-primary` | `#0d9488` | 主强调色 (Teal) |
| `--accent-hover` | `#0f766e` | Hover 状态 |
| `--accent-subtle` | `#ccfbf1` | 轻背景/focus ring |
| `--accent-muted` | `rgba(13, 148, 136, 0.12)` | 未激活的 accent line |

### Text
| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#1a1a1a` | 主文字 |
| `--text-secondary` | `#525252` | 次要文字/标题 |
| `--text-muted` | `#a3a3a3` | 标签/禁用态 |
| `--text-placeholder` | `#d4d4d4` | 占位符 |

### Borders & Shadows
| Token | Value |
|-------|-------|
| `--border-soft` | `rgba(0, 0, 0, 0.06)` |
| `--border-softer` | `rgba(0, 0, 0, 0.03)` |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)` |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)` |

---

## Typography

### Labels
- **Size**: `11px` / `text-[11px]`
- **Weight**: `font-medium`
- **Case**: Sentence case (不用 UPPERCASE)
- **Color**: `var(--text-muted)` → `var(--accent-primary)` on focus

### Section Titles
- **Size**: `14px` / `text-sm`
- **Weight**: `font-semibold`
- **Color**: `var(--text-secondary)`

### Body Text
- **Size**: `14px` / `text-sm`
- **Color**: `var(--text-primary)`

---

## Motion

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | `150ms ease` | Buttons, 小元素 |
| `--transition-base` | `200ms ease` | 大多数交互 |
| `--transition-smooth` | `250ms cubic-bezier(0.4, 0, 0.2, 1)` | 展开/折叠 |

---

## Component Patterns

### Section Card
```
┌────────────────────────────────────┐
│ ▎ Section Title             [⋯] ▾ │  ← 3px accent line + 操作菜单
│ ▎                                  │
│ ▎ Content...                       │
│ ▎                                  │
└────────────────────────────────────┘
```

- **Accent Line**: 3px 左侧，收起时 `accent-muted`，展开时 `accent-primary`
- **Shadow**: `shadow-sm` → `shadow-md` on hover
- **Hover Lift**: `translateY(-0.5px)`

### Input Field
- **Border**: 只有底边框
- **Focus**: 底边框变 `accent-primary`，标签也变色

### Add Button (Dashed)
- **Border**: `2px dashed var(--border-soft)`
- **Hover**: 边框+文字变 `accent-primary`

### Modal / Dropdown
- **Background**: `--card-surface`
- **Shadow**: `shadow-md`
- **Border Radius**: `12px`

---

## Language

**当前规则**: 除 Template 切换外，UI 文案使用**中文**。

| Component | Text |
|-----------|------|
| Section Header | 个人信息 / 工作经历 / 教育背景 / 技能与兴趣 |
| Buttons | 添加经历 / 添加教育 / 添加自定义模块 |
| Labels | 公司名称 / 职位 / 开始日期 / 描述 |
| Actions | 删除 / 编辑 / 保存 |

---

## Accessibility

- Focus ring: `2px solid var(--accent-subtle)`
- Keyboard navigation for all interactive elements
- Minimum touch target: `44px`
