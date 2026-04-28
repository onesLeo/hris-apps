# Phase 0 Aurora UI/UX Design

This document captures the UI/UX handoff for **PeopleOS**, the HRIS product shown in the
Aurora prototype bundle.

Source handoff bundle:
- `C:/Users/onesa/Downloads/HRIS-Apps/design_handoff_hris_aurora/README.md`
- `C:/Users/onesa/Downloads/HRIS-Apps/design_handoff_hris_aurora/aurora-theme.jsx`
- `C:/Users/onesa/Downloads/HRIS-Apps/design_handoff_hris_aurora/aurora-screens.jsx`
- `C:/Users/onesa/Downloads/HRIS-Apps/design_handoff_hris_aurora/aurora-mobile-screens.jsx`

---

## Design Intent

Aurora is a soft, polished, light-mode HRIS interface with:

- blush and lavender gradient backgrounds
- frosted-glass sidebar and header
- white cards with subtle shadows
- rose-pink primary accents
- violet secondary accents
- rounded chips, pills, and badges
- DM Sans typography

The overall feel is calm and premium rather than heavy or enterprise-gray.

---

## Core Tokens

### Colors

- Background gradient: `linear-gradient(145deg, #fce8f3 0%, #f0e8f8 45%, #e8edf8 100%)`
- Background solid: `#fdf0f8`
- Primary accent: `#e8317a`
- Secondary accent: `#8b5cf6`
- Text primary: `#1a1428`
- Text secondary: `#4b4563`
- Text muted: `#9590a8`
- Success: `#10b981`
- Warning: `#f59e0b`
- Danger: `#ef4444`
- Info: `#06b6d4`

### Typography

- Font family: `DM Sans`
- Page title: 18px, 700 weight
- Section title: 14px, 700 weight
- Body text: 13 to 13.5px
- Badge/tag text: 11 to 11.5px, 600 weight

### Layout

- Page padding: 24px top/bottom, 28px left/right
- Large card radius: 16px
- Medium radius: 14px
- Small radius/chips: 10px
- Sidebar width: 232px expanded, 62px collapsed
- Header height: 64px

### Motion

- Sidebar collapse: 300ms width transition
- Card hover lift: translateY(-2px)
- Chart draw: stroke animation on mount
- Bars animate in with staggered timing

---

## Desktop Screens

The prototype focuses on four screens:

1. Dashboard
2. People
3. Leave
4. Approvals

### Dashboard

- Sidebar on the left
- Header across the top
- KPI cards row
- Headcount trend chart
- Department bar chart
- Recent onboardings list
- Pending approvals panel

### People

- Search input
- Filter chips
- Add Employee button
- Employee table with avatar, department, status, work type, joined date, and action icons

### Leave

- Balance cards for leave categories
- Tabbed request table
- Pending rows show Approve and Decline actions

### Approvals

- Summary metrics cards
- Two-column approval cards
- Approve and Decline actions with done states

---

## Mobile Screens

The mobile prototype adapts the same product into:

- bottom tab navigation
- 2x2 KPI tiles on dashboard
- compact chart and quick actions
- card-based people list
- 2x2 leave balance tiles
- stacked approval cards

This should be treated as the mobile baseline for responsive work, not as a separate product.

---

## Navigation

The main sidebar menu in the prototype is:

- Dashboard
- People
- Organization
- Attendance
- Leave
- Approvals
- Payroll
- Performance
- Recruitment
- Learning
- Reports

Only Dashboard, People, Leave, and Approvals are implemented in the prototype, while the other
items can display a coming-soon state until their modules exist.

---

## Implementation Notes

When implementing Aurora in code:

- preserve the rose/violet palette
- keep the frosted-glass header and sidebar feel
- use white cards with soft shadows
- keep spacing airy and rounded
- prefer grid and card layouts over dense admin tables where the design calls for it
- make mobile responsive rather than building a separate visual language

The design should be used as the default visual system for the web app until the product
establishes a different brand direction.

