/**
 * RBAC Permission Matrix
 * Single source of truth for all role-based access control.
 * Checked server-side on every API route / Server Action.
 *
 * RULE: Authorization is ALWAYS done server-side.
 * Frontend may hide elements, but that is NOT enforcement.
 */

export type Role = "admin" | "compliance_manager" | "finance_manager" | "viewer";

export type Permission =
  // Organization
  | "org:manage_settings"
  | "org:manage_users"
  | "org:view"
  // Transactions
  | "transactions:upload"
  | "transactions:view"
  | "validation:resolve"
  // Calculations
  | "calculations:run"
  | "calculations:view"
  // Ledger
  | "ledger:upload"
  | "ledger:view"
  // Reconciliation
  | "reconciliation:run"
  | "reconciliation:view"
  | "reconciliation:resolve"
  // Compliance score
  | "compliance_score:view"
  | "compliance_score:compute"
  // Actions & deadlines
  | "actions:view"
  | "actions:manage"
  // Alerts
  | "alerts:view"
  | "alerts:dismiss"
  // Reports
  | "reports:view"
  | "reports:generate"
  // Audit
  | "audit:view"
  // Regulations & rules
  | "regulations:view"
  | "regulatory_changes:view"
  | "regulatory_changes:analyze"
  | "regulatory_changes:approve"
  | "rule_versions:view"
  | "rule_versions:create";

export const PERMISSIONS: Record<Permission, Role[]> = {
  // Organization
  "org:manage_settings": ["admin"],
  "org:manage_users": ["admin"],
  "org:view": ["admin", "compliance_manager", "finance_manager", "viewer"],

  // Transactions
  "transactions:upload": ["admin", "finance_manager"],
  "transactions:view": ["admin", "compliance_manager", "finance_manager", "viewer"],
  "validation:resolve": ["admin", "finance_manager"],

  // Calculations
  "calculations:run": ["admin", "finance_manager"],
  "calculations:view": ["admin", "compliance_manager", "finance_manager", "viewer"],

  // Ledger
  "ledger:upload": ["admin", "finance_manager"],
  "ledger:view": ["admin", "compliance_manager", "finance_manager", "viewer"],

  // Reconciliation
  "reconciliation:run": ["admin", "finance_manager"],
  "reconciliation:view": ["admin", "compliance_manager", "finance_manager", "viewer"],
  "reconciliation:resolve": ["admin", "finance_manager"],

  // Compliance score
  "compliance_score:view": ["admin", "compliance_manager", "finance_manager", "viewer"],
  "compliance_score:compute": ["admin", "compliance_manager", "finance_manager"],

  // Actions & deadlines
  "actions:view": ["admin", "compliance_manager", "finance_manager", "viewer"],
  "actions:manage": ["admin", "compliance_manager", "finance_manager"],

  // Alerts
  "alerts:view": ["admin", "compliance_manager", "finance_manager", "viewer"],
  "alerts:dismiss": ["admin", "compliance_manager", "finance_manager"],

  // Reports
  "reports:view": ["admin", "compliance_manager", "finance_manager", "viewer"],
  "reports:generate": ["admin", "compliance_manager", "finance_manager"],

  // Audit
  "audit:view": ["admin", "compliance_manager", "finance_manager"],

  // Regulations & rules
  "regulations:view": ["admin", "compliance_manager", "finance_manager", "viewer"],
  "regulatory_changes:view": ["admin", "compliance_manager", "finance_manager", "viewer"],
  "regulatory_changes:analyze": ["admin", "compliance_manager"],
  "regulatory_changes:approve": ["admin", "compliance_manager"],
  "rule_versions:view": ["admin", "compliance_manager", "finance_manager", "viewer"],
  "rule_versions:create": ["admin", "compliance_manager"],
};

/**
 * Check if a role has a given permission.
 * Use this in every API route and Server Action before executing business logic.
 */
export function hasPermission(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return PERMISSIONS[permission]?.includes(role) ?? false;
}

/**
 * Throw a 403-equivalent error if the user lacks permission.
 * Use in API routes: requirePermission(session.user.role, 'calculations:run')
 */
export function requirePermission(role: Role | undefined | null, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Forbidden: requires '${permission}' permission`);
  }
}

/**
 * Get all permissions for a given role.
 * Useful for rendering permission summaries in the Team settings page.
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return (Object.entries(PERMISSIONS) as [Permission, Role[]][])
    .filter(([, roles]) => roles.includes(role))
    .map(([permission]) => permission);
}
