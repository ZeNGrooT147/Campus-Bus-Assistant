
import React, { createContext, useContext } from 'react';
import { AuthContextType } from './types/auth';
import { useAuthState } from './hooks/useAuthState';
import { useAuthActions } from './hooks/useAuthActions';

// Create the Auth Context with the full type
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    user, 
    setUser, 
    isLoading, 
    setIsLoading,
    isAuthenticated,
    role,
    session
  } = useAuthState();
  
  const {
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    navigateToRoleDashboard,
    adminAddUser,
    logoutInProgress
  } = useAuthActions(setUser, setIsLoading);

  // The value we expose via context
  const authContext: AuthContextType = {
    user,
    setUser,
    isAuthenticated,
    role,
    login,
    logout,
    register,
    isLoading,
    forgotPassword,
    resetPassword,
    navigateToRoleDashboard,
    session,
    adminAddUser,
    logoutInProgress
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
