
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { LoginCredentials, RegisterData, AdminAddUserData } from '../types/auth';

export const useAuthActions = (setUser, setIsLoading) => {
  const navigate = useNavigate();
  const [logoutInProgress, setLogoutInProgress] = useState(false);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      console.log('Login attempt with:', { 
        identifier: credentials.identifier, 
        role: credentials.role 
      });
      
      let email = credentials.identifier;
      
      // Check if the identifier is a USN for students
      if (credentials.role === 'student' && !credentials.identifier.includes('@')) {
        // Find the email associated with this USN
        const { data, error } = await supabase
          .from('profiles')
          .select('email')
          .eq('usn', credentials.identifier)
          .eq('role', 'student')
          .single();
          
        if (error || !data?.email) {
          console.error('User not found with USN:', credentials.identifier, error);
          throw new Error('User not found. Please check your USN or register.');
        }
        
        email = data.email;
        console.log('Found email for USN:', email);
      }
      
      // Special case for demo accounts if needed for testing
      if (credentials.role === 'coordinator' && 
          credentials.identifier === 'coordinator@bustracker.edu' && 
          credentials.password === 'password123') {
        console.log('Using demo coordinator account');
        // If you want to create a demo account on the fly, you could do it here
      }
      
      console.log('Attempting Supabase login with:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: credentials.password
      });
      
      if (error) {
        console.error('Supabase login error:', error);
        throw error;
      }
      
      // Check if the user has the correct role
      if (data?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          // Don't throw here, just let login proceed
        } else if (profileData && profileData.role !== credentials.role) {
          console.error(`Role mismatch: User has ${profileData.role} role but tried to login as ${credentials.role}`);
          // We'll let the protected routes handle role redirection
        }
      }
      
      // Provide feedback for successful login
      toast.success("Login successful! Welcome back!");
      
      // Success will be handled by the auth state listener
      return data;
    } catch (error: any) {
      console.error('Login error:', error);
      // Toast error is shown in the component
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Set logout in progress immediately to show UI feedback
      setLogoutInProgress(true);
      
      // Immediately clear user state for fast UI response
      setUser(null);
      
      // Navigate to home immediately
      navigate('/', { replace: true });
      
      // Show success toast immediately for better UX
      toast.success("You have been logged out successfully");
      
      // In parallel, perform the actual logout with Supabase
      setTimeout(async () => {
        try {
          await supabase.auth.signOut();
          // Explicitly clear any session from storage
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.removeItem('supabase.auth.token');
        } catch (e) {
          console.error('Error in async logout:', e);
        } finally {
          setIsLoading(false);
          setLogoutInProgress(false);
        }
      }, 0);
      
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("Failed to log out properly");
      setIsLoading(false);
      setLogoutInProgress(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      
      // Format the region name properly
      let formattedRegion = data.region;
      // We don't need to format it here as we want to store the raw value
      
      // Check if email already exists
      const { data: existingEmail } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', data.email)
        .maybeSingle();
        
      if (existingEmail) {
        throw new Error('Email is already in use');
      }
      
      // Check if USN already exists in database (for students)
      if (data?.usn) {
        const { data: existingUSN } = await supabase
          .from('profiles')
          .select('id')
          .eq('usn', data.usn)
          .maybeSingle();
          
        if (existingUSN) {
          throw new Error('USN is already in use');
        }
      }
      
      // Create the new user
      const userData = {
        name: data.name,
        role: data.role,
        usn: data.usn,
        phone: data.phone,
        region: formattedRegion
      };
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: userData
        }
      });
      
      if (error) {
        console.error('Registration error:', error);
        throw error;
      }
      
      // Success toast is shown in the component
      
      return authData;
    } catch (error: any) {
      console.error('Registration error:', error);
      // Toast error is shown in the component
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
      
      toast.success('Password reset instructions have been sent to your email');
      return true;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({
        password
      });
      
      if (error) throw error;
      
      toast.success('Password has been reset successfully');
      navigate('/login');
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToRoleDashboard = (role) => {
    if (!role) return;
    
    const basePath = `/${role.toLowerCase()}`;
    navigate(basePath, { replace: true });
  };

  const adminAddUser = async (userData: AdminAddUserData) => {
    try {
      setIsLoading(true);
      
      // First, check if email already exists
      const { data: existingEmail } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userData.email)
        .maybeSingle();
        
      if (existingEmail) {
        throw new Error('Email is already in use');
      }
      
      // Format the region name for display but keep raw value for storage
      let regionDisplay = userData.region;
      if (userData.region === 'dharwad') {
        regionDisplay = 'Dharwad Region';
      }
      
      // Create user directly with Supabase
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: userData.name,
          role: userData.role,
          usn: userData.usn,
          phone: userData.phone,
          region: userData.region // Store raw value
        }
      });
      
      if (error) {
        // If we get unauthorized, it means we need to use the function
        if (error.message.includes('not authorized')) {
          // Create user using the edge function instead
          const { data: functionData, error: functionError } = await supabase.functions.invoke('admin-create-user', {
            body: userData
          });
          
          if (functionError) throw functionError;
          
          toast.success(`New ${userData.role} created successfully`);
          return functionData;
        } else {
          throw error;
        }
      }
      
      toast.success(`New ${userData.role} created successfully`);
      return data;
    } catch (error: any) {
      console.error('Admin create user error:', error);
      toast.error(error.message || 'Failed to create user');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    navigateToRoleDashboard,
    adminAddUser,
    logoutInProgress
  };
};
