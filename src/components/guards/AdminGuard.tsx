import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Loader2 } from 'lucide-react';

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * Server-validated admin access guard
 * Prevents unauthorized access by validating admin status server-side via is_admin() RPC
 */
export const AdminGuard = ({ children }: AdminGuardProps) => {
  const { user } = useAuth();
  const { isAdmin, isLoading } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect non-authenticated users to auth page
    if (!isLoading && !user) {
      navigate('/auth', { replace: true });
    }
    
    // Redirect authenticated non-admin users to home
    if (!isLoading && user && !isAdmin) {
      navigate('/', { replace: true });
    }
  }, [user, isAdmin, isLoading, navigate]);

  // Show loading state during validation
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Show access denied for non-authenticated users
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">Please log in to continue</p>
        </div>
      </div>
    );
  }

  // Show access denied for authenticated non-admin users
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Admin Access Required</h2>
          <p className="text-muted-foreground">
            You do not have permission to access this area
          </p>
        </div>
      </div>
    );
  }

  // Render admin content only after server-side validation passes
  return <>{children}</>;
};
