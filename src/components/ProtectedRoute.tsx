import { memo, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Role = 'student' | 'driver' | 'coordinator' | 'admin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role: Role;
}

// Use React.memo to prevent unnecessary re-renders
const ProtectedRoute = memo(({ children, role }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading, session } = useAuth();
  const location = useLocation();
  const [showLoader, setShowLoader] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Only show loading spinner if authentication is taking longer than 300ms
  // This prevents flashing of loading state for quick auth checks
  useEffect(() => {
    if (!isLoading) {
      setShowLoader(false);
      return;
    }
    
    const timer = setTimeout(() => {
      if (isLoading) {
        setShowLoader(true);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Handle authentication errors
  useEffect(() => {
    if (!isLoading && !session && !isAuthenticated) {
      setAuthError('Your session has expired. Please log in again.');
      toast.error('Session expired. Please log in again.');
    }
  }, [isLoading, session, isAuthenticated]);

  // If still loading auth state and we should show the loader
  if (isLoading && showLoader) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="text-lg text-muted-foreground">Loading authentication...</span>
        </div>
      </div>
    );
  }

  // If there's an authentication error
  if (authError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-destructive">Authentication Error</h2>
          <p className="text-muted-foreground">{authError}</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // If session is still loading but we have a clear signal that they need to log in
  if (!session && !isLoading) {
    console.log('No session found, redirecting to login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If not authenticated at all, redirect to login
  if (!isAuthenticated || !user) {
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If authenticated but wrong role, redirect to their dashboard
  if (user.role !== role) {
    console.log(`User has role ${user.role} but trying to access ${role} route, redirecting`);
    
    // Get the correct path for the user's role
    let redirectPath = '/';
    
    if (user.role === 'student') redirectPath = '/student';
    else if (user.role === 'driver') redirectPath = '/driver';
    else if (user.role === 'coordinator') redirectPath = '/coordinator';
    else if (user.role === 'admin') redirectPath = '/admin';
    
    toast.error(`You don't have permission to access this page. Redirecting to your dashboard.`);
    return <Navigate to={redirectPath} replace />;
  }

  // If authenticated and correct role, render the children
  console.log(`User authenticated with correct role: ${role}`);
  return <>{children}</>;
});

ProtectedRoute.displayName = 'ProtectedRoute';

export default ProtectedRoute;
