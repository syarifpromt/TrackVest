# DESIGN.md — Emerald Minimal Capital
## Design System & UI Specifications for TrackVest
> Generated from Stitch Project: **Green Finance App Design** (`projects/13007178210493841772`)  
> Associated PRD: `PRD_Personal_Investment_Portfolio_Tracker_v1.0.md`

---

## 1. Brand Philosophy & Design Movement

**Emerald Minimal Capital** embodies an institutional-grade, ultra-clean financial intelligence environment tailored specifically for individual wealth builders. The core design personality is **precise, serene, trustworthy, and disciplined**.

### Core Movement: Structural Fintech Minimalism
- **Purity of Information:** A surgical white and ultra-light slate canvas ensures numbers, balances, and profit/loss calculations take immediate focal precedence.
- **Controlled Density:** Financial tracking requires balanced breathing room and compact data tables. High-density yield tables and portfolio breakdowns remain readable without visual exhaustion.
- **Restrained Chromatic Feedback:** Emerald greens signal disciplined sustainable growth and positive returns, while controlled rose hues indicate depreciation without triggering alarm fatigue. Deep slate neutrals provide structural weight and stability.

---

## 2. Color Palette

The palette is engineered for dense fiscal scanning and immediate optical clarity between modal, valuation, and profit/loss metrics.

### 2.1 Core Palette Tokens

| Role | Token / Name | Hex Code | Purpose & Application |
|:---|:---|:---|:---|
| **Primary Brand** | `primary` | `#059669` | Primary action buttons, active navigation items, active tab filters, key metric highlights. |
| **Primary Hover** | `primary-hover` | `#047857` | Hover & pressed states for primary buttons and interactive accents. |
| **Primary Container** | `primary-container` | `#00855D` | Accent container surfaces and highlighted indicator badges. |
| **Secondary (Gains)** | `secondary` | `#10B981` | Positive yields, profit badges (`+Profit`), positive trendlines, success states. |
| **Secondary Soft** | `secondary-soft` | `#ECFDF5` | Background for positive return pills and gain banners. |
| **Tertiary (Losses)** | `tertiary` / `danger` | `#F43F5E` | Negative portfolio drawdowns, loss figures (`-Loss`), destructive interactions. |
| **Tertiary Soft** | `tertiary-soft` | `#FFF1F2` | Background for negative drawdown pills and loss alerts. |
| **Surface Canvas** | `background` | `#F8FAFC` | App ground canvas, outer page background. |
| **Card Surface** | `surface` | `#FFFFFF` | Primary card panels, modal dialogs, data table containers. |
| **Surface Alt** | `surface-alt` | `#FAF8FF` | Auxiliary module surfaces, subtle contrasting backgrounds. |
| **Border Subtle** | `border` | `#E2E8F0` | Structural card borders, dividers, table row outlines. |
| **Border Active** | `border-active` | `#CBD5E1` | Input borders, hover card strokes, active segment borders. |
| **Text Primary** | `text-primary` | `#0F172A` | Headlines, primary financial values, total net worth. |
| **Text Secondary** | `text-secondary` | `#334155` | Section subtitles, table headers, form labels. |
| **Text Muted** | `text-muted` | `#64748B` | Timestamp captions, unit descriptors, currency prefixes (`Rp`). |

### 2.2 Material 3 Token Map

```yaml
Material 3 Tokens:
  primary: "#006948"
  primary-container: "#00855D"
  on-primary: "#FFFFFF"
  on-primary-container: "#F5FFF7"
  secondary: "#006C49"
  secondary-container: "#6CF8BB"
  surface: "#FAF8FF"
  surface-container-lowest: "#FFFFFF"
  surface-container-low: "#F2F3FF"
  surface-container: "#EAEDFF"
  surface-container-high: "#E2E7FF"
  surface-container-highest: "#DAE2FD"
  on-surface: "#131B2E"
  on-surface-variant: "#3D4A42"
  outline: "#6D7A72"
  outline-variant: "#BCCAC0"
  error: "#BA1A1A"
  error-container: "#FFDAD6"
```

---

## 3. Typography

The typographic system is powered by **Plus Jakarta Sans**, combining geometric structure with warm legibility.

### 3.1 Tabular Figures Rule
> [!IMPORTANT]
> All currency amounts (e.g. `Rp 125.000.000`), profit/loss numbers, percentages (`+12.4%`), and dates **must** enforce tabular numbers to prevent character jitter and maintain vertical alignment:
> ```css
> font-variant-numeric: tabular-nums;
> font-feature-settings: "tnum" 1;
> ```

### 3.2 Typography Scale

| Style Token | Font Size | Line Height | Weight | Letter Spacing | CSS Utility Example |
|:---|:---|:---|:---|:---|:---|
| **display** | `40px` (`2.5rem`) | `48px` | `700` (Bold) | `-0.02em` | `text-4xl font-bold tracking-tight` |
| **headline-lg** | `32px` (`2rem`) | `40px` | `700` (Bold) | `-0.02em` | `text-3xl font-bold tracking-tight` |
| **headline-lg-mobile** | `26px` (`1.625rem`) | `34px` | `700` (Bold) | `-0.015em` | `text-2xl font-bold tracking-tight` |
| **headline-md** | `24px` (`1.5rem`) | `32px` | `600` (Semibold) | `-0.01em` | `text-2xl font-semibold` |
| **headline-sm** | `20px` (`1.25rem`) | `28px` | `600` (Semibold) | `-0.01em` | `text-xl font-semibold` |
| **metric-display** | `32px` (`2rem`) | `38px` | `700` (Bold) | `-0.02em` | `text-3xl font-bold font-mono-tabular` |
| **metric-md** | `20px` (`1.25rem`) | `26px` | `600` (Semibold) | `-0.01em` | `text-xl font-semibold font-mono-tabular` |
| **title-md** | `16px` (`1rem`) | `24px` | `600` (Semibold) | `0em` | `text-base font-semibold` |
| **body-lg** | `16px` (`1rem`) | `24px` | `400` (Regular) | `0em` | `text-base font-normal` |
| **body-md** | `14px` (`0.875rem`) | `20px` | `400` (Regular) | `0em` | `text-sm font-normal` |
| **body-sm** | `12px` (`0.75rem`) | `16px` | `400` (Regular) | `+0.01em` | `text-xs font-normal` |
| **label-md** | `13px` (`0.8125rem`) | `18px` | `500` (Medium) | `+0.01em` | `text-[13px] font-medium` |
| **label-sm** | `11px` (`0.6875rem`) | `14px` | `600` (Semibold) | `+0.03em` | `text-[11px] font-semibold uppercase tracking-wider` |

---

## 4. Spacing System

Spacing strictly adheres to an **8-point base scale** for consistent visual rhythm:

```yaml
Base Scale:
  space-xs: 0.25rem (4px)   # Micro-spacing between metric label and value
  space-sm: 0.50rem (8px)   # Element gaps, badge internal padding, chip padding
  space-md: 1.00rem (16px)  # Card internal padding, form input spacing
  space-lg: 1.50rem (24px)  # Grid gutters, section breaks, card margins
  space-xl: 2.00rem (32px)  # Outer page margins, major section spacing
```

### Layout Constraints:
- **Max Content Width:** `1440px` (centered via `mx-auto`)
- **Desktop Page Margins (1024px+):** `2rem` (32px)
- **Desktop Grid Gutters:** `1.5rem` (24px)
- **Mobile Page Margins (<768px):** `1rem` (16px)
- **Mobile Grid Gutters:** `1rem` (16px)

---

## 5. Border Radius & Shapes

The interface embraces a **Round 8 / Level 2** profile, balancing modern software warmth with strict financial grid alignment:

| Token | Radius Value | Applied Elements |
|:---|:---|:---|
| **rounded-sm** | `0.25rem` (4px) | Checkboxes, subtle indicator tags |
| **rounded-md / DEFAULT** | `0.5rem` (8px) | Form inputs, dropdown buttons, action triggers, segmented tabs |
| **rounded-lg** | `0.75rem` (12px) | Sub-cards, quick-action chips, nested modules |
| **rounded-xl** | `1.0rem` (16px) | Primary metric cards, summary panels, data tables |
| **rounded-2xl** | `1.5rem` (24px) | Modal dialogs, snapshot review sheets, overlay drawers |
| **rounded-full** | `9999px` | Profit/Loss status pills, category tags, notification badges |

---

## 6. Elevation & Depth (Shadows)

The system rejects murky, heavy shadows, constructing depth through **hairline low-contrast borders** paired with **micro-ambient lighting**:

### 6.1 Shadow Definitions

```css
/* Card Rest Elevation */
--shadow-surface: 0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.02);

/* Hover & Flyout Elevation */
--shadow-hover: 0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04);

/* Modal & Floating Action Elevation */
--shadow-modal: 0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);

/* Focus Accent Halo */
--focus-ring: 0 0 0 3px rgba(5, 150, 105, 0.12);
```

### 6.2 Border Pairing Rule
Every resting surface card **must** pair its micro-shadow with an explicit boundary:
```css
border: 1px solid #E2E8F0;
background-color: #FFFFFF;
```
On hover or active selection, the border transitions to `#CBD5E1` or `#059669`.

---

## 7. Component Styles

### 7.1 Buttons
- **Primary Button:**
  - Background: `#059669` (Forest Emerald)
  - Text: `#FFFFFF`, `font-semibold`, `text-sm`
  - Radius: `8px` (`rounded-lg`)
  - Height: `40px` (standard), `32px` (table inline actions)
  - Hover: Background `#047857`
  - Focus Ring: `2px offset` with `#10B981`
- **Secondary / Ghost Button:**
  - Background: `#FFFFFF` / `transparent`
  - Border: `1px solid #E2E8F0`
  - Text: `#0F172A`
  - Hover: Background `#F1F5F9`, border `#CBD5E1`
- **Destructive Button:**
  - Background: `#FFF1F2`
  - Border: `1px solid #FFE4E6`
  - Text: `#E11D48`
  - Hover: Background `#FFE4E6`

### 7.2 Badges & Status Pills
- **Positive Gain (+Profit):**
  - Shape: `rounded-full` (`px-2.5 py-0.5`)
  - Background: `#ECFDF5`
  - Text: `#047857`, `font-semibold`, `text-xs`
  - Example: `+14.85%` or `+Rp 18.500.000`
- **Negative Drawdown (-Loss):**
  - Shape: `rounded-full` (`px-2.5 py-0.5`)
  - Background: `#FFF1F2`
  - Text: `#BE123C`, `font-semibold`, `text-xs`
  - Example: `-3.20%` or `-Rp 2.400.000`
- **Asset Category Pill:**
  - Background: `#F1F5F9`
  - Border: `1px solid #E2E8F0`
  - Text: `#475569`, `text-[11px]`, `font-semibold uppercase tracking-wider`

### 7.3 Form Inputs & Currency Fields
- **Standard Input:**
  - Height: `42px`, Border Radius: `8px`
  - Background: `#FFFFFF`, Border: `1px solid #CBD5E1`
  - Placeholder: `#94A3B8`
  - Focus State: Border `#059669` with `box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12)`
- **Currency Input (Indonesian Rupiah):**
  - Leading Addon: Fixed `Rp` container with `#64748B` text, background `#F8FAFC`, and a vertical `1px solid #CBD5E1` divider.
  - Value Field: Tabular numeric alignment with thousand-separator support (`10.000.000`).

### 7.4 Portfolio Summary Cards
- Surface: `#FFFFFF`, Border `1px solid #E2E8F0`, Radius `16px`, Micro-shadow rest.
- Three-Tier Anatomy:
  1. **Top Row:** Descriptive metric title (`label-md`, `#64748B`) + relevant icon (e.g., wallet, trending-up, chart-pie).
  2. **Middle Row:** Large primary currency figure in `metric-display` (`#0F172A`).
  3. **Bottom Row:** Profit/loss badge pill paired with contextual baseline comparison text (e.g. `vs Modal Awal`).

### 7.5 Financial Tables & Historical Snapshots
- Frame: White card container with `16px` border-radius and `1px solid #E2E8F0`.
- Row Structure:
  - Header: `#F8FAFC` background, `11px` uppercase tracking-wide labels, `#475569` text.
  - Rows: Separated by hairline `1px solid #F1F5F9`. Hover state shifts to `#F8FAFC`.
  - Column Alignment: Text left-aligned; all numeric currencies, returns, and percentages **strictly right-aligned** using tabular fonts.

---

## 8. Layout Structure & Screen Inventory

The TrackVest application layout is mapped directly from the Stitch designs:

### 8.1 Layout Blueprint
```
+-------------------------------------------------------------------------+
| Top Navigation Bar (Logo: TrackVest, Active Snapshot Date, Action: Cek)  |
+-------------------------------------------------------------------------+
|                                                                         |
| [ Metric Card 1 ]       [ Metric Card 2 ]        [ Metric Card 3 ]       |
| Total Portfolio         Modal Diinvestasikan     Total Profit / Loss    |
| Rp 150.000.000          Rp 120.000.000           +Rp 30.000.000 (+25%)   |
|                                                                         |
+------------------------------------+------------------------------------+
| 8-Column Zone: Asset Allocation     | 4-Column Zone: Snapshot & Quick   |
| Breakdown & Historical Performance | Action Sidebar                     |
| - BTC, Gold, Saham, ETF breakdown  | - Simpan Snapshot Hari Ini        |
| - Return per asset tier            | - Tambah Investasi Baru           |
+------------------------------------+------------------------------------+
| Full-Width Card: Daftar Aset & Evaluasi Terakhir (Data Table)           |
+-------------------------------------------------------------------------+
```

### 8.2 Screen Inventory (from Google Stitch)

1. **Dashboard Portfolio (Redesign & Interactive)**
   - Resource: `projects/13007178210493841772/screens/099c71b028b948949e6caf2cda799a1c` & `1809253e9a4d4c469d7341b85eea057f`
   - Hero greeting banner: "Live Intelligence" status pill, "Halo Budi, ringkasan portfolio investasimu hari ini".
   - 4 Top KPI Metric cards: Total Modal, Nilai Sekarang (with `🕒 Diperbarui kemarin` relative badge), Profit/Loss, and Return Portofolio.
   - Full-width hero trajectory curve with milestone pill nodes (`+4,11%`, `+7,02%`, `STATUS SAAT INI / TARGET +10,34%`).
   - 2-Column lower layout: Donut allocation with segmented multi-color progress bar on the left, and evaluated asset table on the right with net P/L summary banner.
   - Bottom recurring snapshot prompt card.

2. **Cek & Perbarui Nilai Portfolio (Redesign & Interactive)**
   - Resource: `projects/13007178210493841772/screens/f22084e5b9954efda48c6c3b5514bc9f` & `ee3759a012ea4a6e822d60396107c575`
   - First-class evaluation workspace with real-time P/L calculation engine.
   - Date selector with "Hari ini" quick action.
   - Per-asset input rows with capital invested baseline and instant live surplus/deficit badges.
   - Right-side live summary: Total capital, new portfolio valuation, net profit/loss card, multi-segment asset allocation preview, and diversification gauge.
   - Bottom audit assurance banner with reset and snapshot freeze triggers.

3. **Riwayat & Catatan Histori (Redesign & Interactive)**
   - Resource: `projects/13007178210493841772/screens/82d23bc94643460bbb8f84bedcd377f3` & `7bcbcef14f82482cbf6f54ec29c475c7`
   - Subnav switcher: Snapshot Portfolio vs Investasi Modal (Transactions) + CSV Ledger Export.
   - Left Column: Reverse-chronological snapshot cards with title, timestamps, total value, net capital, and yield return chips. Active snapshot card features an emerald border, check icon, and detail indicator.
   - Mini Antar-Snapshot valuation curve visualizing portfolio net worth trajectory over time.
   - Right Column: Dedicated "Detail Terpilih" inspection panel with overall valuation card, net growth, and proportional asset breakdown bars.

4. **Tambah Investasi Modal (Redesign)**
   - Resource: `projects/13007178210493841772/screens/9b409f241c314b53ba6dac7da89ded50`
   - 2-Column modal featuring live portfolio injection impact simulation.
   - Form fields: Investment date, asset selector with quick category recommendation tags, formatted numeric input with quick increment chips (`+100rb`, `+500rb`, `+1Jt`, `+5Jt`), and transaction notes.
   - Right Panel: Live calculation of previous capital, added injection, new total capital, capital injection ratio, and visual progress comparison bar.

5. **Brand Identity & Core Assets (Stitch References)**
   - **TrackVest Minimalist Logo Emblem**: `projects/13007178210493841772/screens/329d63e5ab7249fcbebae692743db325`
     - Emblem: `#0D6E5B` squircle with `#38E1BF` rising trajectory chart line and glowing white circular peak node (`#FFFFFF`).
     - Wordmark: "Track" in deep slate (`#0F172A`) + "Vest" in emerald (`#0D6E5B`), with tagline "Smart Portfolio Tracker".
   - **Emas (Logam Mulia)**: `projects/13007178210493841772/screens/66f984d0de0a40d39ce26f04e60b9587` & `1052e88f1e7745b5aaf3800ed3245e45`
     - Color: `#EAB308` (Gold Bullion), Icon: Golden circular badge with bullion bars silhouette.
   - **BTC (Bitcoin)**: `projects/13007178210493841772/screens/e881e10ee5134a90a68c07571404c2e8` & `430163770096449a81fec25941e3c210`
     - Color: `#F7931A` (Bitcoin Orange), Icon: Orange circular badge with bold white '₿'.
   - **VOO (Vanguard S&P 500 ETF)**: `projects/13007178210493841772/screens/549a9ad4ce804c9ab11a4af1f48cbd2f` & `2fda0b5ffe264ff6a3e983468a73a9a6`
     - Color: `#991B1B` (Vanguard Crimson), Icon: Crimson circular badge with iconic serif 'V'.

---

## 9. Tailwind CSS Configuration Snippet

To integrate this design system directly into Tailwind CSS:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669', // Primary Forest Emerald
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        danger: {
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#f43f5e', // Tertiary Refined Rose
          600: '#e11d48',
          700: '#be123c',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          700: '#334155',
          900: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '1rem', // 16px
        'modal': '1.5rem', // 24px
      },
      boxShadow: {
        'surface': '0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.02)',
        'surface-hover': '0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
        'modal': '0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
      }
    }
  }
};
```

