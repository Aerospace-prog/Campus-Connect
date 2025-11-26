import { useAuth } from '../contexts/auth.context';
import { UserRole } from '../types/models';

/**
 * Role check result interface
 */
interface UseRoleResult {
  /** Current user's role, null if not authenticated */
  role: UserRole | null;
  /** Whether the current user is an admin */
  isAdmin: boolean;
  /** Whether the current user is a student */
  isStudent: boolean;
  /** Whether the auth state is still loading */
  loading: boolean;
  /** Check if user has a specific role */
  hasRole: (requiredRole: UserRole) => boolean;
  /** Check if user has any of the specified roles */
  hasAnyRole: (roles: UserRole[]) => boolean;
}

/**
 * useRole hook - Check current user's role and permissions
 * 
 * @returns Role information and helper functions
 * 
 * @example
 * ```tsx
 * const { isAdmin, hasRole } = useRole();
 * 
 * if (isAdmin) {
 *   // Show admin features
 * }
 * 
 * if (hasRole('admin')) {
 *   // Alternative way to check
 * }
 * ```
 */
export function useRole(): UseRoleResult {
  const { user, loading } = useAuth();

  const role = user?.role ?? null;
  const isAdmin = role === 'admin';
  const isStudent = role === 'student';

  /**
   * Check if user has a specific role
   */
  const hasRole = (requiredRole: UserRole): boolean => {
    return role === requiredRole;
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!role) return false;
    return roles.includes(role);
  };

  return {
    role,
    isAdmin,
    isStudent,
    loading,
    hasRole,
    hasAnyRole,
  };
}
