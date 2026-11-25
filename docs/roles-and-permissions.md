# Roles and permissions

Facil Pay uses role-based access control (RBAC) to decide what each team
member can see and do. The whole model lives in one file —
[`lib/permissions.ts`](../lib/permissions.ts), the single source of truth —
and two components in `components/auth/` enforce it:

- [`<Can>`](#gating-ui-with-can) hides or disables UI elements the
  member's role does not allow.
- [`RouteGuard`](#gating-routes-with-routeguard) blocks whole routes and
  redirects to `/no-access`.

A member's role only counts while their membership is **active**: both
components pass `null` instead of the role for anyone who is not an active
member, and `null` has no permissions at all.

## Roles

| Role | Intended for |
|---|---|
| `owner` | The workspace owner. Full access. |
| `admin` | Workspace administrators. Full access. |
| `developer` | Technical staff who integrate Facil Pay: payments visibility, payment links, and the developer surface (webhooks & API keys). |
| `support` | Support staff who help customers: payments visibility, payment links, and issuing refunds. |
| `viewer` | Read-only members: payments & analytics visibility only. |

## Permissions

Every permission is a key of `PERMISSIONS` in `lib/permissions.ts`, with a
human-readable label that is also used in UI copy (for example the
`<Can>` tooltip):

| Permission | Label |
|---|---|
| `payments:view` | View payments & analytics |
| `payment-links:create` | Create payment links |
| `refunds:create` | Issue refunds |
| `escrow:manage` | Manage escrow & payouts |
| `developers:manage` | Manage webhooks & API keys |
| `team:manage` | Manage team & settings |

## The matrix

Generated from `ROLE_PERMISSIONS` in `lib/permissions.ts` — if the code
and this table ever disagree, the code is right and this table is a bug.

| Permission | Owner | Admin | Developer | Support | Viewer |
|---|---|---|---|---|---|
| `payments:view` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `payment-links:create` | ✓ | ✓ | ✓ | ✓ | — |
| `refunds:create` | ✓ | ✓ | — | ✓ | — |
| `escrow:manage` | ✓ | ✓ | — | — | — |
| `developers:manage` | ✓ | ✓ | ✓ | — | — |
| `team:manage` | ✓ | ✓ | — | — | — |

`owner` and `admin` are granted `Object.keys(PERMISSIONS)` in code, so
they automatically receive every permission added in the future. The
other roles list their permissions explicitly and only gain a new one
when it is added to their list on purpose.

Checks are done with `hasPermission(role, permission)`, which returns
`false` for a `null`/`undefined` role:

```ts
import { hasPermission } from "@/lib/permissions";

hasPermission(member.role, "refunds:create"); // boolean
```

## Gating UI with `<Can>`

`components/auth/Can.tsx` exports the `Can` component and the
`usePermission` hook. `Can` reads the current member itself; you only
supply the permission.

**Hide mode (default)** — the element is removed entirely, or replaced by
`fallback`:

```tsx
import { Can } from "@/components/auth/Can";

<Can permission="payment-links:create">
  <Button onClick={createLink}>New payment link</Button>
</Can>

<Can permission="refunds:create" fallback={<p>Refunds are disabled for your role.</p>}>
  <RefundButton />
</Can>
```

**Disable mode** — the element stays visible but disabled, wrapped in a
tooltip that names the missing permission (`Your role doesn't allow:
Issue refunds`). Use it when showing the feature exists is useful:

```tsx
<Can permission="refunds:create" mode="disable">
  <Button onClick={issueRefund}>Issue refund</Button>
</Can>
```

Disable mode only works when the child is a single valid React element
that accepts `disabled`; otherwise `Can` falls back to hiding it.

**Imperative checks** — use the hook when a boolean is easier than a
wrapper:

```tsx
import { usePermission } from "@/components/auth/Can";

const canManageEscrow = usePermission("escrow:manage");
```

## Gating routes with `RouteGuard`

`components/auth/RouteGuard.tsx` wraps a subtree (typically a dashboard
layout) and checks the current path against `ROUTE_PERMISSIONS`. If the
member's role lacks the required permission, it renders nothing and
redirects to `/no-access?from=<path>`.

```tsx
import { RouteGuard } from "@/components/auth/RouteGuard";

export default function DashboardLayout({ children }) {
  return <RouteGuard>{children}</RouteGuard>;
}
```

Which permission a route needs is decided by the longest matching prefix
in `ROUTE_PERMISSIONS` (so `/settings/api-keys` requires
`developers:manage`, not the `team:manage` of its parent `/settings`):

| Route prefix | Required permission |
|---|---|
| `/escrow` | `escrow:manage` |
| `/payouts` | `escrow:manage` |
| `/refunds` | `payments:view` |
| `/webhooks` | `developers:manage` |
| `/developers` | `developers:manage` |
| `/settings/api-keys` | `developers:manage` |
| `/settings/webhooks` | `developers:manage` |
| `/settings/notifications` | `payments:view` |
| `/settings` | `team:manage` |

A route with no matching prefix is not permission-gated by `RouteGuard`
(`canAccessPath` returns `true`), so adding a sensitive route without
adding it to `ROUTE_PERMISSIONS` leaves it open to every active member.

## How to add a new permission

1. **Declare it** in `PERMISSIONS` in `lib/permissions.ts`, with the
   label the UI should show:

   ```ts
   export const PERMISSIONS = {
     // …existing permissions…
     "invoices:create": "Create invoices",
   } as const;
   ```

   The `Permission` type is `keyof typeof PERMISSIONS`, so the new key is
   immediately type-checked everywhere a permission is used.

2. **Grant it to roles** in `ROLE_PERMISSIONS`. `owner` and `admin` get
   it automatically; add it explicitly to any other role that should
   have it — and update the matrix in this document to match.

3. **Gate the UI** with `<Can permission="invoices:create">` (or
   `usePermission`) around the new controls.

4. **Gate the route**, if the feature has one, by adding its prefix to
   `ROUTE_PERMISSIONS`. Remember: longest prefix wins, and a route with
   no entry is open to all active members.
