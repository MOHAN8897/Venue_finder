# Frontend Theme and Color System

This document describes the color palette, theme variables, and design system used in the VenueFinder frontend, including both the main user app and the super admin dashboard.

---

## 1. **Theme System Overview**

- The project uses **Tailwind CSS** with a custom design system based on CSS variables (HSL values).
- Supports both **light** and **dark** themes (dark mode via `.dark` class).
- All major UI colors (backgrounds, text, accents, status, etc.) are defined as CSS variables and mapped to Tailwind theme extensions.
- The super admin dashboard uses a slightly different palette for branding and clarity.

---

## 2. **Core Color Variables (User App)**

Defined in `src/index.css`:

| Variable                | Light Theme (HSL)         | Dark Theme (HSL)         | Usage/Notes                       |
|------------------------|---------------------------|--------------------------|------------------------------------|
| `--background`         | 0 0% 100%                 | 222.2 84% 4.9%           | Main background                    |
| `--foreground`         | 222.2 84% 4.9%            | 210 40% 98%              | Main text                          |
| `--card`               | 0 0% 100%                 | 222.2 84% 4.9%           | Card backgrounds                   |
| `--card-foreground`    | 222.2 84% 4.9%            | 210 40% 98%              | Card text                          |
| `--popover`            | 0 0% 100%                 | 222.2 84% 4.9%           | Popover backgrounds                |
| `--popover-foreground` | 222.2 84% 4.9%            | 210 40% 98%              | Popover text                       |
| `--primary`            | 222.2 47.4% 11.2%         | 210 40% 98%              | Primary brand color (buttons, etc.)|
| `--primary-foreground` | 210 40% 98%               | 222.2 47.4% 11.2%        | Text on primary                    |
| `--secondary`          | 210 40% 96.1%             | 217.2 32.6% 17.5%        | Secondary backgrounds              |
| `--secondary-foreground`| 222.2 47.4% 11.2%        | 210 40% 98%              | Text on secondary                  |
| `--muted`              | 210 40% 96.1%             | 217.2 32.6% 17.5%        | Muted backgrounds                  |
| `--muted-foreground`   | 215.4 16.3% 46.9%         | 215 20.2% 65.1%          | Muted text                         |
| `--accent`             | 210 40% 96.1%             | 217.2 32.6% 17.5%        | Accent backgrounds                 |
| `--accent-foreground`  | 222.2 47.4% 11.2%         | 210 40% 98%              | Text on accent                     |
| `--destructive`        | 0 84.2% 60.2%             | 0 62.8% 30.6%            | Error/destructive backgrounds      |
| `--destructive-foreground`| 210 40% 98%            | 210 40% 98%              | Text on destructive                |
| `--border`             | 214.3 31.8% 91.4%         | 217.2 32.6% 17.5%        | Borders                            |
| `--input`              | 214.3 31.8% 91.4%         | 217.2 32.6% 17.5%        | Input backgrounds                  |
| `--ring`               | 222.2 84% 4.9%            | 212.7 26.8% 83.9%        | Focus ring                         |
| `--radius`             | 0.5rem                    | 0.5rem                   | Border radius                      |
| `--chart-1`            | 12 76% 61%                | 220 70% 50%              | Chart color 1                      |
| `--chart-2`            | 173 58% 39%               | 160 60% 45%              | Chart color 2                      |
| `--chart-3`            | 197 37% 24%               | 30 80% 55%               | Chart color 3                      |
| `--chart-4`            | 43 74% 66%                | 280 65% 60%              | Chart color 4                      |
| `--chart-5`            | 27 87% 67%                | 340 75% 55%              | Chart color 5                      |

---

## 3. **Super Admin Dashboard Theme**

Defined in `temp_super_admin_dashboard/src/index.css`:

| Variable                | HSL Value                | Usage/Notes                       |
|------------------------|--------------------------|------------------------------------|
| `--dashboard-nav`      | 216 28% 10%              | Dashboard header/nav background    |
| `--dashboard-content`  | 215 28% 6%               | Main dashboard background          |
| `--dashboard-sidebar`  | 217 19% 12%              | Sidebar background                 |
| `--primary`            | 266 85% 58%              | Primary accent (purple/indigo)     |
| `--secondary`          | 217 19% 15%              | Secondary background               |
| `--success`            | 142 69% 58%              | Success/approved status            |
| `--warning`            | 38 92% 50%               | Warning/pending status             |
| `--destructive`        | 0 63% 31%                | Error/rejected status              |
| `--sidebar-primary`    | 266 85% 58%              | Sidebar accent                     |
| `--sidebar-accent`     | 217 19% 18%              | Sidebar accent                     |
| `--sidebar-border`     | 217 19% 18%              | Sidebar border                     |

**Note:** The super admin dashboard uses a dark, modern palette with purple/indigo as the primary accent, and green/yellow/red for status.

---

## 4. **Button and UI Component Colors**

- Buttons and UI elements use Tailwind classes mapped to the above variables:
  - `bg-primary`, `text-primary-foreground`, `bg-secondary`, `bg-accent`, etc.
  - Destructive actions use `bg-destructive` and `text-destructive-foreground`.
  - Focus and ring states use `ring` and `ring-offset-background`.
- All color variants are theme-aware (change with dark mode).

---

## 5. **Gradients and Special Effects**

- Gradients: Used for active tabs and branding, e.g.:
  - `bg-gradient-to-r from-purple-600 to-blue-600` (linear gradient from #9333ea to #2563eb)
- Shadows and overlays: Used for depth, especially in dark mode.

---

## 6. **Status Colors**

- **Success/Approved:** `--success` (142 69% 58%) — Green
- **Warning/Pending:** `--warning` (38 92% 50%) — Yellow/Amber
- **Destructive/Rejected:** `--destructive` (0 63% 31%) — Red

---

## 7. **Usage Notes**

- All colors are HSL for easy theming and accessibility.
- To change the theme, update the CSS variables in `index.css` (user app) or `temp_super_admin_dashboard/src/index.css` (admin dashboard).
- The design system is optimized for accessibility, contrast, and modern UI best practices.

---

## 8. **Sample Swatches**

```css
:root {
  --primary: 222.2 47.4% 11.2%; /* User app primary */
  --primary: 266 85% 58%;       /* Super admin primary */
  --success: 142 69% 58%;       /* Green */
  --warning: 38 92% 50%;        /* Yellow */
  --destructive: 0 63% 31%;     /* Red */
}
```

---

**For more details, see:**
- `src/index.css` (user app theme)
- `temp_super_admin_dashboard/src/index.css` (super admin dashboard theme)
- `tailwind.config.js` (theme mapping)
- UI component files in `src/components/ui/` 