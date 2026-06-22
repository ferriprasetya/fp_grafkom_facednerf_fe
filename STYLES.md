# DESIGN SYSTEM & UI RULES

Project: FaceDNeRF 3D Viewer
Goal: Prevent "agentic" UI (over-engineered, cluttered, boxy, text-heavy). Enforce a strictly clean, modern, and minimalist design.

## 1. COMPONENT PRIORITY (SHADCN/UI)

- Native First: ALWAYS use `shadcn/ui` components for interactive elements.
- Zero Overrides: Trust the design system. Do NOT pass custom `className` to tweak a shadcn component's internal padding, colors, or borders unless absolutely critical.
- Use Variants: Utilize built-in component props (e.g., `variant="outline"`, `variant="ghost"`, `size="sm"`). Do not reinvent styles manually.

## 2. TAILWIND CSS (v4) RESTRICTIONS

- Layout Only: Restrict Tailwind usage primarily to layout orchestrations (Flexbox, Grid, gaps, margins, paddings).
- No Redundant Styling: Do not add custom shadows, rings, or borders to elements if the base component already handles it.
- Modern Aesthetic: Keep it sleek. You may use subtle glassmorphism (`bg-background/60 backdrop-blur-md`) for overlays or floating control panels, but do not overuse visual effects.
- Strict Palette: Stick to semantic theme colors (`bg-background`, `text-primary`, `text-muted-foreground`, `border`). NEVER introduce random arbitrary colors (e.g., `bg-[#1a1a1a]`).

## 3. TYPOGRAPHY & COPYWRITING (CRITICAL)

- Minimal Text: The UI must be intuitive. DO NOT add verbose helper texts, long tooltips, or paragraphs explaining how the app works.
- Placeholder Rule: Use concise placeholders (e.g., "Enter prompt..." instead of "Please type the text prompt you want to apply...").
- Hierarchy over Borders: Use whitespace (gaps/margins) and text contrast (`text-muted-foreground`) to separate sections. Do not rely on drawing borders around every single group of elements.

## 4. STRICT ANTI-PATTERNS (DO NOT DO THIS)

- "Agentic" Clutter: Do not wrap every single input or text block in its own visible `Card`. Let the layout breathe.
- Div Soup: Avoid deeply nested `<div>` wrappers just to add unnecessary paddings.
- Icon Overload: Use icons (e.g., `lucide-react`) sparingly. Do not attach an icon to every single button or label. Less is more.
