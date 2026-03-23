export const ROLE_HIERARCHY: Record<string, number> = {
  sales_rep:         1,
  regional_director: 2,
  executive:         3,
  national_manager:  4,
  analytics_manager: 5,
  admin:             6,
};

export function hasMinRole(userRole: string, minRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[minRole] ?? 999);
}
