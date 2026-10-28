import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export interface AuthContext {
  session: any;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'staff' | string;
    is_active?: boolean;
  };
  isAdmin: boolean;
}

/**
 * Verifies the incoming session and checks whether user is active.
 * Returns null if not authenticated or deactivated.
 */
export async function verifyAuth(): Promise<AuthContext | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return null;
    const user = session.user as any;
    if (user.is_active === false) return null;

    const role = (user.role || 'staff').toLowerCase();
    const isAdmin = role === 'admin' || role === 'super_admin';

    return { session, user, isAdmin };
  } catch (err) {
    console.error('API auth verification error:', err);
    return null;
  }
}

/**
 * Strict role guard: Requires administrator session.
 * Returns 401 if unauthenticated, 403 if staff/unauthorized.
 */
export async function requireAdmin(): Promise<AuthContext | Response> {
  const authCtx = await verifyAuth();
  if (!authCtx) {
    return Response.json(
      { error: 'Authentication required. Please sign in.' },
      { status: 401 }
    );
  }

  if (!authCtx.isAdmin) {
    return Response.json(
      { error: 'Access Denied: Administrative privileges required. Staff operations are strictly restricted.' },
      { status: 403 }
    );
  }

  return authCtx;
}

/**
 * Role guard: Requires active staff or admin session.
 * Rejects unauthenticated requests and deactivated accounts with 401.
 */
export async function requireStaffOrAdmin(): Promise<AuthContext | Response> {
  const authCtx = await verifyAuth();
  if (!authCtx) {
    return Response.json(
      { error: 'Authentication required. Please sign in to perform this operation.' },
      { status: 401 }
    );
  }

  return authCtx;
}

