# Routing Consolidation - Issue #56

## Summary
Move balances and payouts routes into the `(dashboard)` route group to ensure they inherit the dashboard layout, sidebar, authentication guard, and wallet context.

## Changes Required

### Directory Structure
```
BEFORE:
app/
├── (dashboard)/          # Main dashboard group
│   ├── overview/
│   ├── payments/
│   └── ...
├── balances/            # Outside dashboard - no sidebar/auth
└── payouts/             # Outside dashboard - no sidebar/auth

AFTER:
app/
└── (dashboard)/
    ├── overview/
    ├── payments/
    ├── balances/
    ├── payouts/
    └── layout.tsx       # Provides sidebar, auth, wallet context
```

### URL Preservation
- `/balances` → `/balances` (URL unchanged)
- `/payouts` → `/payouts` (URL unchanged)
- Only the internal routing structure changes

### Benefits
1. Balances and payouts inherit dashboard layout (sidebar, top bar)
2. Authentication guard applies to both pages
3. Wallet context available in these pages
4. Consistent UX across all dashboard sections

### Implementation Steps
1. Move `app/balances/` → `app/(dashboard)/balances/`
2. Move `app/payouts/` → `app/(dashboard)/payouts/`
3. Delete standalone `app/balances/layout.tsx` if it exists
4. Delete standalone `app/payouts/layout.tsx` if it exists
5. Check `app/[locale]/escrow` - move or consolidate similarly
6. Verify authentication middleware applies to new routes
7. Test sidebar navigation to both pages

### Files to Update
- Route movement: `app/balances/*` → `app/(dashboard)/balances/*`
- Route movement: `app/payouts/*` → `app/(dashboard)/payouts/*`
- Layout cleanup: remove redundant layout.tsx files
- Navigation: verify sidebar links still work (URLs unchanged)
