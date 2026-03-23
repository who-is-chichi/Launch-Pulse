import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Brand } from '@prisma/client';
import { logger } from '@/lib/logger';
import { ROLE_HIERARCHY } from '@/lib/roles';

export function getOrgId(request: NextRequest): string {
  const orgId = request.headers.get('x-org-id');
  if (!orgId) {
    const err = Object.assign(new Error('Unauthorized'), { status: 401 });
    throw err;
  }
  return orgId;
}

export function getUserId(request: NextRequest): string {
  const userId = request.headers.get('x-user-id');
  if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  return userId;
}

export function getUserRole(request: NextRequest): string {
  return request.headers.get('x-user-role') ?? '';
}

/**
 * Throws 403 if the requesting user's role is below the minimum required level.
 */
export function requireRole(request: NextRequest, minRole: string): void {
  const role = getUserRole(request);
  if (!role) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  if ((ROLE_HIERARCHY[role] ?? 0) < (ROLE_HIERARCHY[minRole] ?? 999)) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
}

/**
 * Verifies that the brand identified by `brandCode` belongs to the given `orgId`.
 * Throws an enriched Error with `.status = 404` on mismatch or if brand not found.
 * Returns 404 (not 403) to avoid confirming resource existence to cross-tenant callers.
 */
export async function assertBrandAccess(
  orgId: string,
  brandCode: string,
  route: string,
): Promise<Brand> {
  const brand = await prisma.brand.findUnique({ where: { code: brandCode } });
  if (!brand) {
    logger.warn('Brand not found', { route, brandCode, orgId });
    throw Object.assign(new Error('Brand not found'), { status: 404 });
  }
  if (brand.orgId !== orgId) {
    logger.warn('OrgId mismatch on brand access', { route, brandCode, orgId, brandOrgId: brand.orgId });
    throw Object.assign(new Error('Brand not found'), { status: 404 });
  }
  return brand;
}
