## Resume Builder Roadmap

### Foundations
- [ ] Initialize Next.js app (`app/` router, TypeScript).
- [ ] Add Tailwind CSS with standard `globals.css` reset and print styles.
- [ ] Install and scaffold shadcn/ui (set registry, configure components folder).

### Core Experience
- [ ] Define data model for resume sections (profile, summary, experience, education, skills, projects, links).
- [ ] Build form-driven editor with shadcn forms and validation (react-hook-form + zod).
- [ ] Live preview pane using the data model.
- [ ] Implement classic one-page resume layout (columns, typographic scale, spacing).
- [ ] Enforce single-page constraint (print CSS + word/line clamp heuristics, overflow indicators).
- [ ] Add template/theme variations (classic serif, modern sans, monochrome, accent).
- [ ] Export to PDF/print-friendly view (print styles + `window.print` flow).

### UX Polish
- [ ] Preset examples and quick-start data for first-time users.
- [ ] Undo/redo or draft autosave (localStorage).
- [ ] Keyboard shortcuts for section add/remove/save.
- [ ] Accessibility pass (focus order, ARIA for forms/preview).
- [ ] Empty states and inline guidance for each section.

### Quality & Ops
- [ ] Lint/format setup (eslint, prettier) and CI script.
- [ ] Basic tests for layout constraints and PDF view.
- [ ] Deployment script (Vercel-ready).

### Notes
- Target aesthetic: refined typographic hierarchy, ample white space, restrained accents, and print-grade alignment that top-tier UI/UX designers would trust.

