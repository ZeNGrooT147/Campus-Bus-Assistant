
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Role } from '../types/auth';
import { fetchUserProfile } from '../utils/auth-utils';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  
  useEffect(() => {
    // Track if component is mounted to prevent memory leaks
    let isMounted = true;
    
    // Initial function to check auth session and set up listener
    const initializeAuth = async () => {
      try {
        // First check if we have a session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        // Update session state
        setSession(sessionData.session);
        
        // If we have a session and user, fetch profile
        if (sessionData.session?.user) {
          try {
            const profile = await fetchUserProfile(sessionData.session.user.id);
            
            if (!isMounted) return;
            
            if (profile) {
              setUser(profile);
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }
        }
        
        // Set up auth listener for future changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!isMounted) return;
            
            console.log('Auth state changed:', event, newSession ? 'with session' : 'no session');
            setSession(newSession);
            
            if (event === 'SIGNED_IN' && newSession?.user) {
              try {
                const profile = await fetchUserProfile(newSession.user.id);
                
                if (!isMounted) return;
                
                if (profile) {
                  console.log('Profile fetched after sign in:', profile);
                  setUser(profile);
                }
              } catch (error) {
                console.error('Error fetching profile on sign in:', error);
              }
            } else if (event === 'SIGNED_OUT') {
              console.log('User signed out, clearing state');
              setUser(null);
            }
          }
        );
        
        // Cleanup function to prevent memory leaks and state updates after unmount
        return () => {
          subscription.unsubscribe();
          isMounted = false;
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    // Initialize auth
    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  return { 
    user, 
    setUser, 
    isLoading, 
    setIsLoading,
    isAuthenticated: !!user,
    role: user?.role || null,
    session
  };
};
